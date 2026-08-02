import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { getDb } from "@/lib/db";
import { categories, examOutlineItems, exams, questionAcceptedAnswers, questionOptions, questionTopics, questions } from "@/lib/db/schema";
import { resolveDirection } from "./types";

export async function getPublicExamBySlug(slug: string) {
  return getDb().select({
    id: exams.id, slug: exams.slug, title: exams.title, shortDescription: exams.shortDescription, description: exams.description, instructions: exams.instructions,
    locale: exams.locale, direction: exams.direction, difficulty: exams.difficulty, durationSeconds: exams.durationSeconds, passingScorePercent: exams.passingScorePercent,
    maxAttempts: exams.maxAttempts, retryCooldownMinutes: exams.retryCooldownMinutes, categoryName: categories.name, categorySlug: categories.slug
  }).from(exams).innerJoin(categories, eq(exams.categoryId, categories.id)).where(and(eq(exams.slug, slug), eq(exams.status, "PUBLISHED"), isNull(exams.deletedAt), eq(categories.status, "ACTIVE"))).limit(1).then((rows) => rows[0] ?? null);
}

export async function getPublicHomeDiscovery() {
  const db = getDb();
  const parentCategory = alias(categories, "home_parent_category");
  const pathCategory = alias(categories, "home_path_category");
  const [rootCategories, publishedExams] = await Promise.all([
    db.select({ id: categories.id, name: categories.name, slug: categories.slug, description: categories.description, locale: categories.locale, direction: categories.direction }).from(categories).where(and(isNull(categories.parentId), eq(categories.status, "ACTIVE"), isNull(categories.deletedAt))).orderBy(asc(categories.sortOrder)).limit(6),
    db.select({ id: exams.id, slug: exams.slug, title: exams.title, shortDescription: exams.shortDescription, locale: exams.locale, direction: exams.direction, durationSeconds: exams.durationSeconds, difficulty: exams.difficulty, categoryName: categories.name, categorySlug: categories.slug, levelName: parentCategory.name, levelSlug: parentCategory.slug, pathName: pathCategory.name, pathSlug: pathCategory.slug }).from(exams).innerJoin(categories, eq(exams.categoryId, categories.id)).leftJoin(parentCategory, eq(categories.parentId, parentCategory.id)).leftJoin(pathCategory, eq(parentCategory.parentId, pathCategory.id)).where(and(eq(exams.status, "PUBLISHED"), isNull(exams.deletedAt), eq(categories.status, "ACTIVE"))).orderBy(asc(exams.publishedAt)).limit(48)
  ]);
  return { rootCategories, publishedExams };
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
