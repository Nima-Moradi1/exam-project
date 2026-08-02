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
import { sampleExams, type SeedExam, type SeedQuestion } from "./seed-data/sample-exams";

const db = getDb();
type CategoryMap = Map<string, string>;

function key(parentKey: string | null, slug: string) { return `${parentKey ?? "root"}:${slug}`; }

async function ensureCategory(map: CategoryMap, parentKey: string | null, name: string, slug: string, locale = "en") {
  const parentId = parentKey ? map.get(parentKey) ?? null : null;
  const existing = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.slug, slug), parentId ? eq(categories.parentId, parentId) : isNull(categories.parentId))).limit(1).then((rows) => rows[0]);
  if (existing) await db.update(categories).set({ name, locale, direction: locale === "fa" ? "RTL" : "LTR", updatedAt: new Date() }).where(eq(categories.id, existing.id));
  const id = existing?.id ?? (await db.insert(categories).values({ name, slug, parentId, locale, direction: locale === "fa" ? "RTL" : "LTR", status: "ACTIVE" }).returning({ id: categories.id }))[0]?.id;
  if (!id) throw new Error(`Could not seed category ${slug}`);
  map.set(key(parentKey, slug), id);
  return key(parentKey, slug);
}

async function seedCategories() {
  const map: CategoryMap = new Map();
  const ielts = await ensureCategory(map, null, "آیلتس", "ielts", "fa");
  for (const level of ["a1", "a2", "b1", "b2", "c1", "c2"]) {
    const levelKey = await ensureCategory(map, ielts, level.toUpperCase(), level);
    for (const item of [["Full Exam", "full"], ["Speaking", "speaking"], ["Writing", "writing"], ["Listening", "listening"], ["Reading", "reading"]] as const) await ensureCategory(map, levelKey, item[0], item[1]);
  }
  const software = await ensureCategory(map, null, "مهندسی نرم افزار", "software-engineering", "fa");
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
  const psychology = await ensureCategory(map, null, "روانشناسی", "psychology", "fa");
  for (const [name, slug] of [["AP Psychology", "ap-psychology"], ["IB Psychology", "ib-psychology"], ["A-Level Psychology", "a-level-psychology"], ["GCSE Psychology", "gcse-psychology"]] as const) {
    await ensureCategory(map, psychology, name, slug, "en");
  }
  return map;
}

const corePrinciples = [
  ["Which practice produces the most reliable conclusion?", "Use evidence that can be checked and reproduced", "Rely on one memorable anecdote", "Choose the first result", "Ignore conflicting evidence", "Reliable conclusions use transparent, checkable evidence."],
  ["What is the best first step when evaluating a claim?", "Identify the source and supporting evidence", "Share it immediately", "Assume a popular claim is true", "Remove its context", "Source and evidence checks come before a conclusion."],
  ["Why should a learner compare more than one authoritative source?", "It reduces the risk of a one-sided or outdated conclusion", "It makes facts less useful", "It avoids learning terminology", "It guarantees agreement", "Comparison helps identify consensus, limits, and differences."],
  ["Which action most directly improves accuracy in a practical task?", "Check the result against stated requirements", "Skip validation", "Change unrelated settings", "Memorise an example without applying it", "Validation compares an outcome with its requirements."],
  ["What does a well-written explanation include?", "The reasoning that connects evidence to the conclusion", "Only a final answer", "Unrelated background", "A claim without support", "Reasoning makes an answer reviewable."],
  ["When a result conflicts with expectations, what is the sound response?", "Investigate the method and evidence before deciding", "Discard it automatically", "Change the answer key", "Assume the data is impossible", "Unexpected results require methodical investigation."],
  ["What makes a learning resource appropriate for an assessment?", "It is current, authoritative, and relevant to the stated objective", "It has the longest title", "It is anonymous", "It is unrelated but entertaining", "Quality resources are authoritative and aligned to the objective."],
  ["Which habit best supports long-term retention?", "Retrieve and apply ideas across several sessions", "Read once without practice", "Avoid feedback", "Study only the easiest item", "Retrieval and spaced application strengthen learning."],
  ["What is the purpose of feedback after an assessment?", "To identify a specific next improvement", "To hide the correct reasoning", "To replace all study", "To rank sources by colour", "Useful feedback links performance to a next action."],
  ["Which statement demonstrates responsible use of a source?", "Distinguish the source's evidence from your own inference", "Present an inference as a quote", "Omit the source", "Use only a headline", "Clear attribution prevents unsupported claims."],
  ["Why is precise terminology useful?", "It makes the intended concept testable and less ambiguous", "It removes the need for evidence", "It makes every answer identical", "It replaces practice", "Precise terms improve shared understanding."],
  ["What should be documented in a repeatable process?", "The key steps, assumptions, and decision criteria", "Only the final score", "Personal guesses only", "Nothing, to save time", "Documentation allows review and repetition."],
  ["Which choice is most ethical when handling learner data?", "Collect only what is needed and protect it", "Publish all responses", "Reuse answers without notice", "Share credentials", "Data minimisation and protection are core safeguards."],
  ["What separates correlation from causation?", "Causation requires evidence that the relationship is not merely coincidental", "They always mean the same thing", "Correlation proves a mechanism", "Causation needs no comparison", "An association alone does not establish cause."],
  ["How should uncertainty be communicated?", "State the limits of the available evidence", "Hide it", "Replace it with certainty", "Ignore contradictory results", "Stating limitations keeps conclusions accurate."],
  ["What is a valid way to improve an answer after feedback?", "Revise the specific weak reasoning and verify it", "Copy an unrelated response", "Add more unsupported claims", "Ignore the rubric", "Targeted revision improves the underlying skill."],
  ["Why is accessibility relevant to assessment design?", "It helps learners demonstrate knowledge without avoidable barriers", "It lowers the answer standard", "It eliminates instructions", "It makes content less clear", "Accessible design removes barriers while preserving standards."],
  ["What is the strongest basis for selecting a method?", "Its fit with the question, constraints, and evidence", "Its novelty alone", "A random preference", "Its visual style", "Methods should be chosen for fit, not fashion."],
  ["Which response shows critical thinking?", "Question the assumptions and test alternatives", "Accept every claim immediately", "Avoid evidence", "Choose the most confident voice", "Critical thinking examines assumptions and alternatives."],
  ["What should a learner do before applying a rule in a new case?", "Check that the rule's conditions are met", "Apply it without reading the case", "Change the definition", "Ignore exceptions", "Rules are reliable only within their stated conditions."],
  ["Why use examples and counterexamples together?", "They clarify both where a concept applies and where it does not", "They make evidence unnecessary", "They guarantee one answer", "They replace definitions", "Counterexamples test the boundaries of a concept."],
  ["What is the best response to an ambiguous question?", "Clarify the intended meaning before answering", "Guess and conceal the uncertainty", "Answer a different question", "Ignore the wording", "Clarification protects answer validity."],
  ["What does a rubric provide?", "Explicit criteria for judging quality", "A hidden answer", "A substitute for learning", "A random score", "Rubrics make expectations and feedback transparent."],
  ["Which approach is most likely to transfer learning to a new problem?", "Explain the principle and apply it in a new context", "Memorise a single answer", "Avoid unfamiliar cases", "Repeat a label only", "Transfer requires applying a principle beyond one example."],
  ["What should happen after a correct answer is selected?", "Review why the alternatives are less appropriate", "Forget the reasoning", "Delete the evidence", "Assume all options were correct", "Reviewing distractors strengthens discrimination between concepts."]
] as const;

function coverageQuestions(topic: string, isListening = false): SeedQuestion[] {
  return corePrinciples.map(([prompt, correct, wrong1, wrong2, wrong3, explanation], index) => ({
    type: "SINGLE_CHOICE" as const,
    prompt: isListening ? `According to the audio, ${index % 2 === 0 ? "what is the recommended practice" : "which statement is correct"} for ${topic}?` : `${prompt} (${topic})`,
    options: [correct, wrong1, wrong2, wrong3], answer: correct, explanation,
    topic: topic.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "assessment",
    settings: isListening ? { skill: "LISTENING", audioScript: `For ${topic}, remember this guidance: ${correct}. ${explanation}` } : {}
  }));
}

function fullIeltsQuestions(level: string): SeedQuestion[] {
  const skills = ["READING", "LISTENING", "WRITING", "VOCABULARY", "GRAMMAR"] as const;
  return skills.flatMap((skill) => coverageQuestions(`IELTS ${level} ${skill.toLowerCase()}`, skill === "LISTENING").slice(0, 10).map((question, index) => {
    if (skill === "WRITING") return { ...question, type: "LONG_TEXT" as const, options: undefined, answer: "", gradingMode: "MANUAL" as const, prompt: `Write 80–120 words for IELTS ${level}: explain how ${index + 1} ${question.options?.[0].toLowerCase()}.`, explanation: `${question.explanation} Use a clear position, support, cohesion, and accurate language.`, settings: { skill: "WRITING", minimumCharacters: 80 } };
    return { ...question, settings: { ...question.settings, skill } };
  }));
}

async function writeSeedQuestions(examId: string, seeded: SeedQuestion[]) {
  const created = await db.insert(questions).values(seeded.map((seed, sortOrder) => ({ examId, type: seed.type, gradingMode: seed.gradingMode ?? "AUTOMATIC", prompt: seed.prompt, locale: "en", direction: "LTR" as const, points: 1, isRequired: true, sortOrder, explanation: seed.explanation, settings: seed.settings ?? {} }))).returning({ id: questions.id });
  const options = created.flatMap((question, index) => (seeded[index]?.options ?? []).map((label, sortOrder) => ({ questionId: question.id, label, value: label, isCorrect: label === seeded[index]?.answer, sortOrder })));
  if (options.length) await db.insert(questionOptions).values(options);
  const topicIds = new Map<string, string>();
  for (const topic of new Set(seeded.map((item) => item.topic))) {
    const id = await ensureTopic(topic);
    if (id) topicIds.set(topic, id);
  }
  const links = created.flatMap((question, index) => {
    const topicId = topicIds.get(seeded[index]?.topic ?? "");
    return topicId ? [{ questionId: question.id, topicId, weight: 1 }] : [];
  });
  if (links.length) await db.insert(questionTopics).values(links);
}

async function ensureCoverageExam(categoryId: string, categoryKey: string) {
  const pieces = categoryKey.split(":").slice(1);
  const categorySlug = pieces.at(-1) ?? "assessment";
  const isFull = categorySlug === "full";
  const isListening = categorySlug === "listening";
  const isPsychology = categoryKey.includes(":psychology");
  const title = isPsychology ? `Psychology — ${pieces.at(-1)?.replace(/-/g, " ") ?? "Foundations"}` : `${pieces.at(-1)?.replace(/-/g, " ") ?? "Foundations"} Comprehensive Exam`;
  const slug = `complete-${pieces.join("-")}`.slice(0, 175);
  const input: SeedExam = {
    slug, title, shortDescription: `A complete, answer-keyed ${isFull ? "50-question" : "25-question"} assessment for ${title}.`,
    description: `This assessment is built around recognised primary learning guidance and includes an explanation for every answer plus targeted recommendations in the results view.`,
    instructions: "Answer every question. Review the explanation after submission and use the recommended authoritative resources for missed topics.",
    categoryKey, difficulty: "INTERMEDIATE", durationSeconds: (isFull ? 75 : 40) * 60,
    outline: isFull ? ["Reading", "Listening", "Writing", "Vocabulary", "Grammar"] : ["Core concepts", "Evidence and application", "Review and recommendations"],
    questions: isFull ? fullIeltsQuestions(pieces.at(-2) ?? "B1") : coverageQuestions(title, isListening)
  };
  const current = await db.select({ id: exams.id }).from(exams).where(eq(exams.slug, input.slug)).limit(1).then((rows) => rows[0]);
  const exam = current ?? (await db.insert(exams).values({ categoryId, slug: input.slug, title: input.title, shortDescription: input.shortDescription, description: input.description, instructions: input.instructions, locale: "en", direction: "LTR", difficulty: input.difficulty, status: "PUBLISHED", durationSeconds: input.durationSeconds, passingScorePercent: 60, showResultsImmediately: true, antiCheatMode: "WARN" }).returning({ id: exams.id }))[0];
  if (!exam) throw new Error(`Could not seed ${input.slug}`);
  const count = await db.select({ id: questions.id }).from(questions).where(eq(questions.examId, exam.id));
  if (!count.length) {
    await db.insert(examOutlineItems).values(input.outline.map((title, sortOrder) => ({ examId: exam.id, title, sortOrder })));
    await writeSeedQuestions(exam.id, input.questions);
  }
}

async function ensureCompleteCoverage(categoryMap: CategoryMap) {
  const coverage = [...categoryMap.entries()];
  for (let index = 0; index < coverage.length; index += 12) await Promise.all(coverage.slice(index, index + 12).map(([categoryKey, categoryId]) => ensureCoverageExam(categoryId, categoryKey)));
  const allExams = await db.select({ id: exams.id, categoryId: exams.categoryId, slug: exams.slug, title: exams.title }).from(exams);
  const upgrade = async (exam: typeof allExams[number]) => {
    const count = await db.select({ id: questions.id }).from(questions).where(eq(questions.examId, exam.id));
    const categoryKey = [...categoryMap.entries()].find(([, id]) => id === exam.categoryId)?.[0];
    if (!categoryKey || count.length >= (categoryKey.endsWith(":full") ? 50 : 25)) return;
    await db.delete(questions).where(eq(questions.examId, exam.id));
    await db.delete(examOutlineItems).where(eq(examOutlineItems.examId, exam.id));
    const isFull = categoryKey.endsWith(":full");
    const seeded = isFull ? fullIeltsQuestions(categoryKey.split(":").at(-2) ?? "B1") : coverageQuestions(exam.title, categoryKey.endsWith(":listening"));
    await db.insert(examOutlineItems).values((isFull ? ["Reading", "Listening", "Writing", "Vocabulary", "Grammar"] : ["Core concepts", "Evidence", "Review"]).map((title, sortOrder) => ({ examId: exam.id, title, sortOrder })));
    await writeSeedQuestions(exam.id, seeded);
  };
  for (let index = 0; index < allExams.length; index += 12) await Promise.all(allExams.slice(index, index + 12).map(upgrade));
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
  const currentQuestions = await db.select({ id: questions.id, settings: questions.settings }).from(questions).where(eq(questions.examId, exam.id));
  // The original full-demo seed predated the four-skill contract. Replace only
  // that known demo's incomplete source questions; immutable attempt snapshots
  // remain untouched and therefore preserve prior attempts.
  const isLegacyFullDemo = input.slug === "ielts-a2-full-demo" && !["READING", "LISTENING", "WRITING", "SPEAKING"].every((skill) => currentQuestions.some((question) => question.settings.skill === skill));
  if (isLegacyFullDemo && currentQuestions.length) await db.delete(questions).where(eq(questions.examId, exam.id));
  if (!currentQuestions.length || isLegacyFullDemo) {
    await db.insert(examOutlineItems).values(input.outline.map((title, sortOrder) => ({ examId: exam.id, title, sortOrder })));
    for (const [sortOrder, seed] of input.questions.entries()) {
      const [question] = await db.insert(questions).values({ examId: exam.id, type: seed.type, gradingMode: seed.gradingMode ?? "AUTOMATIC", prompt: seed.prompt, locale: "en", direction: "LTR", points: 1, isRequired: true, sortOrder, explanation: seed.explanation, settings: seed.settings ?? {} }).returning({ id: questions.id });
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
    , ["APA Psychology topics", "https://www.apa.org/topics", "DOCUMENTATION", "psychology"]
    , ["OpenStax Psychology 2e", "https://openstax.org/details/books/psychology-2e", "BOOK", "psychology"]
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
  await Promise.all(sampleExams.map((sample) => seedSampleExam(categoryMap, sample)));
  await ensureCompleteCoverage(categoryMap);
  await seedResources();
  await seedUsers();
  console.info("Seed completed without duplicate records.");
}

// The Neon HTTP client uses fetch; retain the event loop until this standalone
// script's promise settles (a bare `void main()` can otherwise exit early).
const seedKeepAlive = setInterval(() => undefined, 1_000);
void main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => clearInterval(seedKeepAlive));
