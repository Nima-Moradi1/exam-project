import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { hashPassword } from "@/lib/auth/password";
import { getDb } from "@/lib/db";
import { categories, examOutlineItems, exams, learningResources, questionAcceptedAnswers, questionOptions, questionTopics, questions, resourceTopics, topics, users } from "@/lib/db/schema";
import { normalizeTextAnswer } from "@/lib/grading/normalization";
import { cssPart1Syllabus, cssPart2Syllabus, htmlSyllabus } from "@/lib/exam-syllabi";
import { cssPart1AnswerKey, cssPart2AnswerKey } from "@/lib/questions/css.private.server";
import { cssPart1Questions, cssPart2Questions } from "@/lib/questions/css.public";
import { answerKey } from "@/lib/questions/private.server";
import { publicQuestions } from "@/lib/questions/public";
import { sampleExams, type SeedExam } from "./seed-data/sample-exams";

const db = getDb();
type CategoryMap = Map<string, string>;

function key(parentKey: string | null, slug: string) { return `${parentKey ?? "root"}:${slug}`; }

async function ensureCategory(map: CategoryMap, parentKey: string | null, name: string, slug: string, locale = "en") {
  const parentId = parentKey ? map.get(parentKey) ?? null : null;
  const existing = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.slug, slug), parentId ? eq(categories.parentId, parentId) : isNull(categories.parentId))).limit(1).then((rows) => rows[0]);
  const id = existing?.id ?? (await db.insert(categories).values({ name, slug, parentId, locale, direction: locale === "fa" ? "RTL" : "LTR", status: "ACTIVE" }).returning({ id: categories.id }))[0]?.id;
  if (!id) throw new Error(`Could not seed category ${slug}`);
  map.set(key(parentKey, slug), id);
  return key(parentKey, slug);
}

async function seedCategories() {
  const map: CategoryMap = new Map();
  const ielts = await ensureCategory(map, null, "IELTS", "ielts");
  for (const level of ["a1", "a2", "b1", "b2", "c1", "c2"]) {
    const levelKey = await ensureCategory(map, ielts, level.toUpperCase(), level);
    for (const item of [["Full Exam", "full"], ["Speaking", "speaking"], ["Writing", "writing"], ["Listening", "listening"], ["Reading", "reading"]] as const) await ensureCategory(map, levelKey, item[0], item[1]);
  }
  const software = await ensureCategory(map, null, "Software Engineering", "software-engineering");
  const groups = {
    frontend: [["HTML", "html"], ["CSS", "css"], ["JavaScript", "javascript"], ["TypeScript", "typescript"], ["React.js", "react"], ["Next.js", "nextjs"], ["Micro-frontend", "micro-frontend"]],
    backend: [["Node.js", "nodejs"], ["API Design", "api-design"], ["Authentication & Authorization", "authentication"], ["Testing", "testing"], ["System Design", "system-design"]],
    database: [["SQL", "sql"], ["PostgreSQL", "postgresql"], ["Data Modeling", "data-modeling"], ["Indexing", "indexing"], ["Transactions", "transactions"]],
    devops: [["Git & GitHub", "git-github"], ["CI/CD", "ci-cd"], ["Docker", "docker"], ["Kubernetes", "kubernetes"], ["Observability", "observability"]]
  } as const;
  for (const [group, children] of Object.entries(groups)) {
    const groupKey = await ensureCategory(map, software, group[0].toUpperCase() + group.slice(1), group);
    for (const [name, slug] of children) await ensureCategory(map, groupKey, name, slug);
  }
  return map;
}

async function ensureTopic(slug: string) {
  const existing = await db.select({ id: topics.id }).from(topics).where(eq(topics.slug, slug)).limit(1).then((rows) => rows[0]);
  return existing?.id ?? (await db.insert(topics).values({ name: slug.replace(/-/g, " "), slug, locale: "en" }).returning({ id: topics.id }))[0]?.id;
}

function legacyType(type: string) {
  return type === "descriptive" ? "SHORT_TEXT" : type === "dropdown" ? "DROPDOWN" : type === "multiple-choice" ? "SINGLE_CHOICE" : "TRUE_FALSE" as const;
}

async function seedQuestion(examId: string, question: { id: string; type: string; text: string; placeholder?: string; choices?: readonly { id: string; label: string }[] }, answer: { answer: string | boolean; explanation: string }, sortOrder: number, topicSlug: string) {
  const existing = await db.select({ id: questions.id }).from(questions).where(and(eq(questions.examId, examId), eq(questions.sortOrder, sortOrder))).limit(1);
  if (existing.length) return;
  const type = legacyType(question.type);
  const [created] = await db.insert(questions).values({ examId, type, gradingMode: "AUTOMATIC", prompt: question.text, direction: "RTL", locale: "fa", points: 1, isRequired: true, sortOrder, explanation: answer.explanation, settings: question.placeholder ? { placeholder: question.placeholder } : {} }).returning({ id: questions.id });
  if (!created) throw new Error("Question seed failed");
  if (question.choices?.length) await db.insert(questionOptions).values(question.choices.map((choice, index) => ({ questionId: created.id, label: choice.label, value: choice.id, isCorrect: String(choice.id) === String(answer.answer), sortOrder: index })));
  if (type === "SHORT_TEXT") await db.insert(questionAcceptedAnswers).values({ questionId: created.id, answer: String(answer.answer), answerNormalized: normalizeTextAnswer(String(answer.answer)), sortOrder: 0 });
  const topicId = await ensureTopic(topicSlug);
  if (topicId) await db.insert(questionTopics).values({ questionId: created.id, topicId, weight: 1 });
}

async function ensureLegacyExam(input: { slug: string; title: string; description: string; categoryId: string; durationSeconds: number; syllabus: readonly string[]; questions: readonly { id: string; type: string; text: string; placeholder?: string; choices?: readonly { id: string; label: string }[] }[]; answers: Record<string, { answer: string | boolean; explanation: string }> }) {
  const current = await db.select().from(exams).where(eq(exams.slug, input.slug)).limit(1).then((rows) => rows[0]);
  const exam = current ?? (await db.insert(exams).values({ categoryId: input.categoryId, slug: input.slug, title: input.title, shortDescription: input.description, description: input.description, instructions: "پاسخ‌ها را با دقت ثبت کنید. زمان آزمون سمت سرور کنترل می‌شود.", locale: "fa", direction: "RTL", difficulty: "INTERMEDIATE", status: "PUBLISHED", durationSeconds: input.durationSeconds, passingScorePercent: 60, showResultsImmediately: true, antiCheatMode: "WARN" }).returning())[0];
  if (!exam) throw new Error(`Could not seed ${input.slug}`);
  const outlineCount = await db.select({ id: examOutlineItems.id }).from(examOutlineItems).where(eq(examOutlineItems.examId, exam.id)).limit(1);
  if (!outlineCount.length) await db.insert(examOutlineItems).values(input.syllabus.map((title, sortOrder) => ({ examId: exam.id, title, sortOrder })));
  for (const [index, question] of input.questions.entries()) {
    const answer = input.answers[question.id];
    if (answer) await seedQuestion(exam.id, question, answer, index, input.slug);
  }
}

async function seedSampleExam(categoryMap: CategoryMap, input: SeedExam) {
  const categoryId = categoryMap.get(input.categoryKey);
  if (!categoryId) throw new Error(`Missing sample category ${input.categoryKey}`);
  const current = await db.select().from(exams).where(eq(exams.slug, input.slug)).limit(1).then((rows) => rows[0]);
  const exam = current ?? (await db.insert(exams).values({ categoryId, slug: input.slug, title: input.title, shortDescription: input.shortDescription, description: input.description, instructions: input.instructions, locale: "en", direction: "LTR", difficulty: input.difficulty, status: "PUBLISHED", durationSeconds: input.durationSeconds, passingScorePercent: 60, showResultsImmediately: true, antiCheatMode: "WARN" }).returning())[0];
  if (!exam) throw new Error(`Could not seed ${input.slug}`);
  const currentQuestions = await db.select({ id: questions.id }).from(questions).where(eq(questions.examId, exam.id)).limit(1);
  if (!currentQuestions.length) {
    await db.insert(examOutlineItems).values(input.outline.map((title, sortOrder) => ({ examId: exam.id, title, sortOrder })));
    for (const [sortOrder, seed] of input.questions.entries()) {
      const [question] = await db.insert(questions).values({ examId: exam.id, type: seed.type, gradingMode: "AUTOMATIC", prompt: seed.prompt, locale: "en", direction: "LTR", points: 1, isRequired: true, sortOrder, explanation: seed.explanation, settings: {} }).returning({ id: questions.id });
      if (!question) continue;
      const options = seed.options ?? (seed.type === "TRUE_FALSE" ? ["True", "False"] : []);
      if (options.length) await db.insert(questionOptions).values(options.map((label, index) => ({ questionId: question.id, label, value: seed.type === "TRUE_FALSE" ? String(index === 0) : label, isCorrect: Array.isArray(seed.answer) ? seed.answer.includes(label) : seed.type === "TRUE_FALSE" ? String(seed.answer) === String(index === 0) : seed.answer === label, sortOrder: index })));
      if (seed.type === "SHORT_TEXT") await db.insert(questionAcceptedAnswers).values({ questionId: question.id, answer: String(seed.answer), answerNormalized: normalizeTextAnswer(String(seed.answer), { normalizePersian: false }), sortOrder: 0 });
      const topicId = await ensureTopic(seed.topic);
      if (topicId) await db.insert(questionTopics).values({ questionId: question.id, topicId, weight: 1 });
    }
  }
}

async function seedResources() {
  const resources = [
    ["MDN HTML guides", "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content", "DOCUMENTATION", "html"],
    ["MDN CSS guides", "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics", "DOCUMENTATION", "css"],
    ["TypeScript Handbook", "https://www.typescriptlang.org/docs/handbook/intro.html", "DOCUMENTATION", "typescript-basics"],
    ["React Learn", "https://react.dev/learn", "DOCUMENTATION", "react-components"],
    ["Next.js Learn", "https://nextjs.org/learn", "COURSE", "nextjs"],
    ["PostgreSQL Tutorial", "https://www.postgresql.org/docs/current/tutorial.html", "DOCUMENTATION", "postgresql"],
    ["Docker Get Started", "https://docs.docker.com/get-started/", "DOCUMENTATION", "docker"],
    ["Kubernetes Basics", "https://kubernetes.io/docs/tutorials/kubernetes-basics/", "DOCUMENTATION", "kubernetes"],
    ["British Council IELTS preparation", "https://takeielts.britishcouncil.org/take-ielts/prepare", "EXERCISE", "ielts-reading"],
    ["LearnEnglish video series", "https://learnenglish.britishcouncil.org/free-resources/general/video-series", "VIDEO", "ielts-reading"],
    ["LearnEnglish podcasts", "https://learnenglish.britishcouncil.org/free-resources/general/audio-series/podcasts/s3", "PODCAST", "ielts-reading"],
    ["Film English viewing guides", "https://film-english.com/", "FILM", "ielts-reading"],
    ["Alice's Adventures in Wonderland", "https://www.gutenberg.org/ebooks/11", "BOOK", "ielts-reading"]
  ] as const;
  for (const [title, url, type, topicSlug] of resources) {
    const existing = await db.select({ id: learningResources.id }).from(learningResources).where(eq(learningResources.url, url)).limit(1);
    const resourceId = existing[0]?.id ?? (await db.insert(learningResources).values({ title, description: `Curated learning resource: ${title}.`, type, url, locale: "en", isActive: true }).returning({ id: learningResources.id }))[0]?.id;
    const topicId = await ensureTopic(topicSlug);
    if (resourceId && topicId) {
      const linked = await db.select({ resourceId: resourceTopics.resourceId }).from(resourceTopics).where(and(eq(resourceTopics.resourceId, resourceId), eq(resourceTopics.topicId, topicId))).limit(1);
      if (!linked.length) await db.insert(resourceTopics).values({ resourceId, topicId, weight: 1 });
    }
  }
}

async function seedUsers() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminPassword) {
    const username = process.env.SEED_ADMIN_USERNAME ?? "admin";
    const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.usernameNormalized, username.toLowerCase())).limit(1);
    if (!existing.length) await db.insert(users).values({ username, usernameNormalized: username.toLowerCase(), email: email.toLowerCase(), name: username, displayName: username, passwordHash: await hashPassword(adminPassword), role: "SUPER_ADMIN", status: "ACTIVE" });
  }
  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (demoPassword) {
    const username = process.env.SEED_DEMO_USERNAME ?? "demo-user";
    const email = process.env.SEED_DEMO_EMAIL ?? "demo@example.com";
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.usernameNormalized, username.toLowerCase())).limit(1);
    if (!existing.length) await db.insert(users).values({ username, usernameNormalized: username.toLowerCase(), email: email.toLowerCase(), name: username, displayName: username, passwordHash: await hashPassword(demoPassword), role: "USER", status: "ACTIVE" });
  }
}

async function main() {
  const categoryMap = await seedCategories();
  const htmlCategoryId = categoryMap.get("root:software-engineering:frontend:html");
  const cssCategoryId = categoryMap.get("root:software-engineering:frontend:css");
  if (!htmlCategoryId || !cssCategoryId) throw new Error("Legacy seed categories are missing.");
  await ensureLegacyExam({ slug: "html-foundations-fa", title: "آزمون جامع HTML", description: "آزمون فارسی مبانی HTML، عناصر معنایی، فرم‌ها و رسانه‌ها.", categoryId: htmlCategoryId, durationSeconds: 35 * 60, syllabus: htmlSyllabus.items, questions: publicQuestions, answers: answerKey });
  await ensureLegacyExam({ slug: "css-part-1-fa", title: "آزمون CSS — بخش ۱", description: "آزمون فارسی انتخاب‌کننده‌ها، box model و استایل‌دهی پایه.", categoryId: cssCategoryId, durationSeconds: 45 * 60, syllabus: cssPart1Syllabus.items, questions: cssPart1Questions, answers: cssPart1AnswerKey });
  await ensureLegacyExam({ slug: "css-part-2-fa", title: "آزمون CSS — بخش ۲", description: "آزمون فارسی چیدمان، واکنش‌گرایی، transform و animation.", categoryId: cssCategoryId, durationSeconds: 45 * 60, syllabus: cssPart2Syllabus.items, questions: cssPart2Questions, answers: cssPart2AnswerKey });
  for (const sample of sampleExams) await seedSampleExam(categoryMap, sample);
  await seedResources();
  await seedUsers();
  console.info("Seed completed without duplicate records.");
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
