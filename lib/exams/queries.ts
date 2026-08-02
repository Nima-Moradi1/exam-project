import "server-only";

import { and, asc, count, desc, eq, ilike, inArray, isNull, or, type SQL } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { getDb } from "@/lib/db";
import { categories, examOutlineItems, exams, questionAcceptedAnswers, questionOptions, questionTopics, questions } from "@/lib/db/schema";
import { DISCOVERY_PAGE_SIZE, type DiscoveryFilters } from "./discovery";
import { resolveDirection } from "./types";

export async function getPublicExamBySlug(slug: string) {
  return getDb().select({
    id: exams.id, slug: exams.slug, title: exams.title, shortDescription: exams.shortDescription, description: exams.description, instructions: exams.instructions,
    locale: exams.locale, direction: exams.direction, difficulty: exams.difficulty, durationSeconds: exams.durationSeconds, passingScorePercent: exams.passingScorePercent,
    maxAttempts: exams.maxAttempts, retryCooldownMinutes: exams.retryCooldownMinutes, showResultsImmediately: exams.showResultsImmediately,
    learningObjectives: exams.learningObjectives, categoryName: categories.name, categorySlug: categories.slug
  }).from(exams).innerJoin(categories, eq(exams.categoryId, categories.id)).where(and(eq(exams.slug, slug), eq(exams.status, "PUBLISHED"), isNull(exams.deletedAt), eq(categories.status, "ACTIVE"))).limit(1).then((rows) => rows[0] ?? null);
}

const difficulties = ["BEGINNER", "ELEMENTARY", "INTERMEDIATE", "UPPER_INTERMEDIATE", "ADVANCED", "EXPERT"] as const;

async function getPublicHomeDiscoveryUncached(filters: DiscoveryFilters) {
  const db = getDb();
  const categoryRows = await db.select({ id: categories.id, parentId: categories.parentId, name: categories.name, slug: categories.slug, description: categories.description, locale: categories.locale, direction: categories.direction }).from(categories).where(and(eq(categories.status, "ACTIVE"), isNull(categories.deletedAt))).orderBy(asc(categories.sortOrder));
  const byId = new Map(categoryRows.map((category) => [category.id, category]));
  const lineage = (categoryId: string) => {
    const result = [] as typeof categoryRows;
    let current = byId.get(categoryId);
    while (current) { result.unshift(current); current = current.parentId ? byId.get(current.parentId) : undefined; }
    return result;
  };
  const rootCategories = categoryRows.filter((category) => !category.parentId);
  const descendantsOf = (slugs: string[]) => {
    if (!slugs.length) return null;
    const selected = new Set(categoryRows.filter((category) => slugs.includes(category.slug)).map((category) => category.id));
    let changed = true;
    while (changed) {
      changed = false;
      for (const category of categoryRows) {
        if (category.parentId && selected.has(category.parentId) && !selected.has(category.id)) {
          selected.add(category.id);
          changed = true;
        }
      }
    }
    return selected;
  };
  const categorySets = [descendantsOf(filters.paths), descendantsOf(filters.levels), descendantsOf(filters.topics)].filter((set): set is Set<string> => set !== null);
  const allowedCategoryIds = categorySets.length
    ? [...categorySets.reduce((result, set) => new Set([...result].filter((id) => set.has(id))))]
    : [];
  const safeDifficulties = filters.difficulties.filter((item): item is typeof difficulties[number] => difficulties.includes(item as typeof difficulties[number]));
  const where: Array<SQL | undefined> = [
    eq(exams.status, "PUBLISHED"),
    isNull(exams.deletedAt),
    eq(categories.status, "ACTIVE"),
    categorySets.length ? allowedCategoryIds.length ? inArray(exams.categoryId, allowedCategoryIds) : eq(exams.id, "00000000-0000-0000-0000-000000000000") : undefined,
    safeDifficulties.length ? inArray(exams.difficulty, safeDifficulties) : undefined,
    filters.q ? or(ilike(exams.title, `%${filters.q}%`), ilike(exams.shortDescription, `%${filters.q}%`), ilike(categories.name, `%${filters.q}%`)) : undefined
  ];
  const predicate = and(...where);
  const [totalRow, facetRows] = await Promise.all([
    db.select({ value: count() }).from(exams).innerJoin(categories, eq(exams.categoryId, categories.id)).where(predicate),
    db.select({ categoryId: exams.categoryId, difficulty: exams.difficulty, value: count() }).from(exams).innerJoin(categories, eq(exams.categoryId, categories.id)).where(predicate).groupBy(exams.categoryId, exams.difficulty)
  ]);
  const total = Number(totalRow[0]?.value ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / DISCOVERY_PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const examRows = await db.select({
    id: exams.id,
    slug: exams.slug,
    title: exams.title,
    shortDescription: exams.shortDescription,
    locale: exams.locale,
    direction: exams.direction,
    durationSeconds: exams.durationSeconds,
    difficulty: exams.difficulty,
    categoryId: exams.categoryId,
    questionCount: count(questions.id)
  }).from(exams)
    .innerJoin(categories, eq(exams.categoryId, categories.id))
    .leftJoin(questions, and(eq(questions.examId, exams.id), isNull(questions.deletedAt)))
    .where(predicate)
    .groupBy(exams.id)
    .orderBy(filters.sort === "title" ? asc(exams.title) : desc(exams.publishedAt), asc(exams.id))
    .limit(DISCOVERY_PAGE_SIZE)
    .offset((page - 1) * DISCOVERY_PAGE_SIZE);
  const publishedExams = examRows.flatMap((exam) => {
    const trail = lineage(exam.categoryId);
    const leaf = trail.at(-1);
    const root = trail[0];
    if (!leaf || !root) return [];
    const level = trail[1] ?? leaf;
    return [{ ...exam, categoryName: leaf.name, categorySlug: leaf.slug, levelName: level.name, levelSlug: level.slug, pathName: root.name, pathSlug: root.slug }];
  });
  const facetCounts = new Map<string, number>();
  for (const row of facetRows) {
    const value = Number(row.value);
    for (const category of lineage(row.categoryId)) facetCounts.set(category.slug, (facetCounts.get(category.slug) ?? 0) + value);
    facetCounts.set(row.difficulty, (facetCounts.get(row.difficulty) ?? 0) + value);
  }
  return {
    rootCategories,
    publishedExams,
    filters: { ...filters, page },
    pagination: { page, pageSize: DISCOVERY_PAGE_SIZE, total, totalPages },
    facets: {
      paths: rootCategories.map((category) => ({ value: category.slug, label: category.name, count: facetCounts.get(category.slug) ?? 0 })),
      levels: categoryRows.filter((category) => category.parentId && byId.get(category.parentId)?.parentId === null).map((category) => ({ value: category.slug, label: category.name, count: facetCounts.get(category.slug) ?? 0 })),
      topics: categoryRows.filter((category) => category.parentId && byId.get(category.parentId)?.parentId !== null).map((category) => ({ value: category.slug, label: category.name, count: facetCounts.get(category.slug) ?? 0 })),
      difficulties: difficulties.map((difficulty) => ({ value: difficulty, count: facetCounts.get(difficulty) ?? 0 }))
    }
  };
}

export function getPublicHomeDiscovery(filters: DiscoveryFilters) {
  return unstable_cache(
    () => getPublicHomeDiscoveryUncached(filters),
    ["public-discovery", JSON.stringify(filters)],
    { revalidate: 300, tags: ["public-exams", "public-categories"] }
  )();
}

export async function getPublishedExamSitemapRows() {
  return getDb().select({ slug: exams.slug, updatedAt: exams.updatedAt }).from(exams).where(and(eq(exams.status, "PUBLISHED"), isNull(exams.deletedAt))).orderBy(asc(exams.slug));
}

export async function getPublishedCategorySitemapRows() {
  return getDb().select({ slug: categories.slug, updatedAt: categories.updatedAt }).from(categories).where(and(eq(categories.status, "ACTIVE"), isNull(categories.deletedAt))).orderBy(asc(categories.slug));
}

export async function getExamPublicFacts(examId: string) {
  const rows = await getDb().select({ type: questions.type }).from(questions).where(and(eq(questions.examId, examId), isNull(questions.deletedAt))).orderBy(asc(questions.sortOrder));
  return {
    questionCount: rows.length,
    questionTypes: [...new Set(rows.map((row) => row.type))]
  };
}

export async function getExamOutline(examId: string) {
  return getDb().select().from(examOutlineItems).where(eq(examOutlineItems.examId, examId)).orderBy(asc(examOutlineItems.sortOrder));
}

export async function getAdminExam(examId: string) {
  const db = getDb();
  const exam = await db.select().from(exams).where(eq(exams.id, examId)).limit(1).then((rows) => rows[0] ?? null);
  if (!exam) return null;
  const [outline, questionRows] = await Promise.all([
    getExamOutline(exam.id),
    db.select().from(questions).where(and(eq(questions.examId, exam.id), isNull(questions.deletedAt))).orderBy(asc(questions.sortOrder))
  ]);
  return { exam, outline, questions: questionRows };
}

export async function getQuestionWithAnswers(questionId: string) {
  const db = getDb();
  const question = await db.select().from(questions).where(eq(questions.id, questionId)).limit(1).then((rows) => rows[0] ?? null);
  if (!question) return null;
  const [options, acceptedAnswers] = await Promise.all([
    db.select().from(questionOptions).where(eq(questionOptions.questionId, question.id)).orderBy(asc(questionOptions.sortOrder)),
    db.select().from(questionAcceptedAnswers).where(eq(questionAcceptedAnswers.questionId, question.id)).orderBy(asc(questionAcceptedAnswers.sortOrder))
  ]);
  return { question, options, acceptedAnswers };
}

export async function getExamQuestionsForSnapshot(examId: string) {
  const db = getDb();
  const questionRows = await db.select().from(questions).where(and(eq(questions.examId, examId), isNull(questions.deletedAt))).orderBy(asc(questions.sortOrder));
  return Promise.all(questionRows.map(async (question) => ({
    question,
    options: await db.select().from(questionOptions).where(eq(questionOptions.questionId, question.id)).orderBy(asc(questionOptions.sortOrder)),
    acceptedAnswers: await db.select().from(questionAcceptedAnswers).where(eq(questionAcceptedAnswers.questionId, question.id)).orderBy(asc(questionAcceptedAnswers.sortOrder)),
    topicIds: (await db.select({ topicId: questionTopics.topicId }).from(questionTopics).where(eq(questionTopics.questionId, question.id))).map((topic) => topic.topicId)
  })));
}

export function toPublicQuestionSnapshot(input: Awaited<ReturnType<typeof getExamQuestionsForSnapshot>>[number], examLocale: string, examDirection: "AUTO" | "LTR" | "RTL", position: number, optionIds: string[]) {
  const orderedOptions = optionIds.map((id) => input.options.find((option) => option.id === id)).filter((option): option is NonNullable<typeof option> => Boolean(option));
  const safeSettings = { ...input.question.settings };
  delete safeSettings.target;
  delete safeSettings.ordering;
  delete safeSettings.pairs;
  return {
    version: 1,
    id: input.question.id,
    position,
    type: input.question.type,
    prompt: input.question.prompt,
    description: input.question.description,
    locale: input.question.locale ?? examLocale,
    direction: resolveDirection(input.question.direction, input.question.locale ?? examLocale, resolveDirection(examDirection, examLocale)),
    points: input.question.points,
    isRequired: input.question.isRequired,
    settings: safeSettings,
    options: orderedOptions.map((option) => ({ id: option.id, label: option.label, value: option.value }))
  };
}
