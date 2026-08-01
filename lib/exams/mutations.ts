"use server";

import { and, asc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit/service";
import { requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { categories, examOutlineItems, exams, questionAcceptedAnswers, questionOptions, questionTopics, questions } from "@/lib/db/schema";
import { normalizeDescriptiveAnswer } from "@/lib/grading.server";
import { getQuestionWithAnswers } from "./queries";
import { examInputSchema, questionInputSchema } from "./schemas";

type MutationResult = { ok: true; id?: string } | { ok: false; code: string; message: string };

function invalidateExam(examId?: string, slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin/exams", "layout");
  if (examId) revalidatePath(`/admin/exams/${examId}`, "layout");
  if (slug) revalidatePath(`/exams/${slug}`);
}

export async function createExam(input: unknown): Promise<MutationResult> {
  const actor = await requirePermission("exam:create");
  const parsed = examInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "آزمون معتبر نیست." };
  const db = getDb();
  const category = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.id, parsed.data.categoryId), isNull(categories.deletedAt))).limit(1);
  if (!category.length) return { ok: false, code: "NOT_FOUND", message: "دسته‌بندی انتخاب‌شده پیدا نشد." };
  const created = await db.insert(exams).values({ ...parsed.data, createdByUserId: actor.id, updatedByUserId: actor.id }).returning({ id: exams.id });
  await writeAuditLog({ actorUserId: actor.id, action: "CREATE", entityType: "exam", entityId: created[0]?.id, after: parsed.data });
  invalidateExam(created[0]?.id, parsed.data.slug);
  return { ok: true, id: created[0]?.id };
}

export async function updateExam(examId: string, input: unknown): Promise<MutationResult> {
  const actor = await requirePermission("exam:update");
  const parsed = examInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "آزمون معتبر نیست." };
  const db = getDb();
  const existing = await db.select().from(exams).where(eq(exams.id, examId)).limit(1).then((rows) => rows[0]);
  if (!existing) return { ok: false, code: "NOT_FOUND", message: "آزمون پیدا نشد." };
  await db.update(exams).set({ ...parsed.data, updatedByUserId: actor.id, updatedAt: new Date() }).where(eq(exams.id, examId));
  await writeAuditLog({ actorUserId: actor.id, action: "UPDATE", entityType: "exam", entityId: examId, before: { slug: existing.slug, status: existing.status }, after: parsed.data });
  invalidateExam(examId, parsed.data.slug);
  return { ok: true, id: examId };
}

export async function validateExamForPublication(examId: string) {
  const db = getDb();
  const exam = await db.select().from(exams).where(eq(exams.id, examId)).limit(1).then((rows) => rows[0]);
  if (!exam) return ["آزمون پیدا نشد."];
  const failures: string[] = [];
  if (!exam.categoryId || exam.durationSeconds < 60 || !exam.title.trim() || !exam.slug.trim()) failures.push("اطلاعات پایهٔ آزمون ناقص است.");
  const questionRows = await db.select().from(questions).where(and(eq(questions.examId, examId), isNull(questions.deletedAt)));
  if (!questionRows.length) failures.push("آزمون حداقل به یک پرسش نیاز دارد.");
  if (!questionRows.reduce((total, question) => total + question.points, 0)) failures.push("جمع امتیاز پرسش‌ها باید بیشتر از صفر باشد.");
  for (const question of questionRows) {
    if (question.gradingMode === "AUTOMATIC" && ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "DROPDOWN"].includes(question.type)) {
      const correct = await db.select({ id: questionOptions.id }).from(questionOptions).where(and(eq(questionOptions.questionId, question.id), eq(questionOptions.isCorrect, true))).limit(1);
      if (!correct.length) failures.push(`پرسش «${question.prompt.slice(0, 50)}» پاسخ درست ندارد.`);
    }
    if (question.type === "SHORT_TEXT" && question.gradingMode === "AUTOMATIC") {
      const answers = await db.select({ id: questionAcceptedAnswers.id }).from(questionAcceptedAnswers).where(eq(questionAcceptedAnswers.questionId, question.id)).limit(1);
      if (!answers.length) failures.push(`پرسش کوتاه «${question.prompt.slice(0, 50)}» پاسخ پذیرفته‌شده ندارد.`);
    }
  }
  return failures;
}

export async function publishExam(examId: string): Promise<MutationResult> {
  const actor = await requirePermission("exam:publish");
  const failures = await validateExamForPublication(examId);
  if (failures.length) return { ok: false, code: "VALIDATION_ERROR", message: failures.join(" ") };
  const db = getDb();
  const exam = await db.update(exams).set({ status: "PUBLISHED", publishedAt: new Date(), updatedByUserId: actor.id, updatedAt: new Date() }).where(eq(exams.id, examId)).returning({ slug: exams.slug });
  await writeAuditLog({ actorUserId: actor.id, action: "PUBLISH", entityType: "exam", entityId: examId });
  invalidateExam(examId, exam[0]?.slug);
  return { ok: true, id: examId };
}

export async function unpublishExam(examId: string): Promise<MutationResult> {
  const actor = await requirePermission("exam:publish");
  const exam = await getDb().update(exams).set({ status: "DRAFT", updatedByUserId: actor.id, updatedAt: new Date() }).where(eq(exams.id, examId)).returning({ slug: exams.slug });
  await writeAuditLog({ actorUserId: actor.id, action: "UNPUBLISH", entityType: "exam", entityId: examId });
  invalidateExam(examId, exam[0]?.slug);
  return { ok: true, id: examId };
}

export async function archiveExam(examId: string): Promise<MutationResult> {
  const actor = await requirePermission("exam:delete");
  const exam = await getDb().update(exams).set({ status: "ARCHIVED", updatedByUserId: actor.id, updatedAt: new Date() }).where(eq(exams.id, examId)).returning({ slug: exams.slug });
  await writeAuditLog({ actorUserId: actor.id, action: "ARCHIVE", entityType: "exam", entityId: examId });
  invalidateExam(examId, exam[0]?.slug);
  return { ok: true, id: examId };
}

export async function restoreExam(examId: string): Promise<MutationResult> {
  const actor = await requirePermission("exam:update");
  const exam = await getDb().update(exams).set({ status: "DRAFT", updatedByUserId: actor.id, updatedAt: new Date() }).where(eq(exams.id, examId)).returning({ slug: exams.slug });
  await writeAuditLog({ actorUserId: actor.id, action: "RESTORE", entityType: "exam", entityId: examId });
  invalidateExam(examId, exam[0]?.slug);
  return { ok: true, id: examId };
}

export async function deleteUnusedExam(examId: string): Promise<MutationResult> {
  const actor = await requirePermission("exam:delete");
  const db = getDb();
  const exam = await db.select().from(exams).where(eq(exams.id, examId)).limit(1).then((rows) => rows[0]);
  if (!exam || exam.status !== "DRAFT") return { ok: false, code: "CONFLICT", message: "فقط پیش‌نویس‌های استفاده‌نشده قابل حذف هستند." };
  await db.delete(exams).where(eq(exams.id, examId));
  await writeAuditLog({ actorUserId: actor.id, action: "DELETE", entityType: "exam", entityId: examId });
  invalidateExam(undefined, exam.slug);
  return { ok: true, id: examId };
}

export async function duplicateExam(examId: string): Promise<MutationResult> {
  const actor = await requirePermission("exam:create");
  const db = getDb();
  const source = await db.select().from(exams).where(eq(exams.id, examId)).limit(1).then((rows) => rows[0]);
  if (!source) return { ok: false, code: "NOT_FOUND", message: "آزمون پیدا نشد." };
  const copy = await db.insert(exams).values({ ...source, id: undefined, slug: `${source.slug}-copy-${Date.now()}`, title: `${source.title} (کپی)`, status: "DRAFT", publishedAt: null, createdByUserId: actor.id, updatedByUserId: actor.id, createdAt: new Date(), updatedAt: new Date() }).returning({ id: exams.id });
  await writeAuditLog({ actorUserId: actor.id, action: "CREATE", entityType: "exam", entityId: copy[0]?.id, metadata: { duplicatedFrom: examId } });
  invalidateExam(copy[0]?.id);
  return { ok: true, id: copy[0]?.id };
}

export async function createQuestion(input: unknown): Promise<MutationResult> {
  const actor = await requirePermission("question:create");
  const parsed = questionInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "پرسش معتبر نیست." };
  const db = getDb();
  const created = await db.transaction(async (transaction) => {
    const [question] = await transaction.insert(questions).values({ ...parsed.data, locale: parsed.data.locale ?? null, description: parsed.data.description ?? null, explanation: parsed.data.explanation ?? null, modelAnswer: parsed.data.modelAnswer ?? null }).returning({ id: questions.id });
    if (!question) throw new Error("Question insertion failed");
    if (parsed.data.options.length) await transaction.insert(questionOptions).values(parsed.data.options.map((option) => ({ questionId: question.id, label: option.label, value: option.value, isCorrect: option.isCorrect, explanation: option.explanation ?? null, sortOrder: option.sortOrder })));
    if (parsed.data.acceptedAnswers.length) await transaction.insert(questionAcceptedAnswers).values(parsed.data.acceptedAnswers.map((answer, index) => ({ questionId: question.id, answer, answerNormalized: normalizeDescriptiveAnswer(answer), sortOrder: index })));
    if (parsed.data.topicIds.length) await transaction.insert(questionTopics).values(parsed.data.topicIds.map((topicId) => ({ questionId: question.id, topicId, weight: 1 })));
    return question;
  });
  await writeAuditLog({ actorUserId: actor.id, action: "CREATE", entityType: "question", entityId: created.id });
  invalidateExam(parsed.data.examId);
  return { ok: true, id: created.id };
}

export async function updateQuestion(questionId: string, input: unknown): Promise<MutationResult> {
  const actor = await requirePermission("question:update");
  const parsed = questionInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "پرسش معتبر نیست." };
  const db = getDb();
  const current = await getQuestionWithAnswers(questionId);
  if (!current) return { ok: false, code: "NOT_FOUND", message: "پرسش پیدا نشد." };
  await db.transaction(async (transaction) => {
    await transaction.update(questions).set({ ...parsed.data, locale: parsed.data.locale ?? null, description: parsed.data.description ?? null, explanation: parsed.data.explanation ?? null, modelAnswer: parsed.data.modelAnswer ?? null, updatedAt: new Date() }).where(eq(questions.id, questionId));
    await transaction.delete(questionOptions).where(eq(questionOptions.questionId, questionId));
    await transaction.delete(questionAcceptedAnswers).where(eq(questionAcceptedAnswers.questionId, questionId));
    await transaction.delete(questionTopics).where(eq(questionTopics.questionId, questionId));
    if (parsed.data.options.length) await transaction.insert(questionOptions).values(parsed.data.options.map((option) => ({ questionId, label: option.label, value: option.value, isCorrect: option.isCorrect, explanation: option.explanation ?? null, sortOrder: option.sortOrder })));
    if (parsed.data.acceptedAnswers.length) await transaction.insert(questionAcceptedAnswers).values(parsed.data.acceptedAnswers.map((answer, index) => ({ questionId, answer, answerNormalized: normalizeDescriptiveAnswer(answer), sortOrder: index })));
    if (parsed.data.topicIds.length) await transaction.insert(questionTopics).values(parsed.data.topicIds.map((topicId) => ({ questionId, topicId, weight: 1 })));
  });
  await writeAuditLog({ actorUserId: actor.id, action: "UPDATE", entityType: "question", entityId: questionId });
  invalidateExam(parsed.data.examId);
  return { ok: true, id: questionId };
}

export async function deleteQuestion(questionId: string): Promise<MutationResult> {
  const actor = await requirePermission("question:delete");
  const question = await getDb().update(questions).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(questions.id, questionId)).returning({ examId: questions.examId });
  await writeAuditLog({ actorUserId: actor.id, action: "DELETE", entityType: "question", entityId: questionId });
  invalidateExam(question[0]?.examId);
  return { ok: true, id: questionId };
}

export async function restoreQuestion(questionId: string): Promise<MutationResult> {
  const actor = await requirePermission("question:update");
  const question = await getDb().update(questions).set({ deletedAt: null, updatedAt: new Date() }).where(eq(questions.id, questionId)).returning({ examId: questions.examId });
  await writeAuditLog({ actorUserId: actor.id, action: "RESTORE", entityType: "question", entityId: questionId });
  invalidateExam(question[0]?.examId);
  return { ok: true, id: questionId };
}

export async function reorderQuestion(questionId: string, direction: "up" | "down"): Promise<MutationResult> {
  const actor = await requirePermission("question:update");
  const db = getDb();
  const current = await db.select().from(questions).where(eq(questions.id, questionId)).limit(1).then((rows) => rows[0]);
  if (!current) return { ok: false, code: "NOT_FOUND", message: "پرسش پیدا نشد." };
  const rows = await db.select().from(questions).where(and(eq(questions.examId, current.examId), isNull(questions.deletedAt))).orderBy(asc(questions.sortOrder));
  const index = rows.findIndex((row) => row.id === current.id);
  const target = rows[index + (direction === "up" ? -1 : 1)];
  if (!target) return { ok: true, id: current.id };
  await db.transaction(async (transaction) => {
    await transaction.update(questions).set({ sortOrder: target.sortOrder }).where(eq(questions.id, current.id));
    await transaction.update(questions).set({ sortOrder: current.sortOrder }).where(eq(questions.id, target.id));
  });
  await writeAuditLog({ actorUserId: actor.id, action: "UPDATE", entityType: "question", entityId: questionId, metadata: { reorder: direction } });
  invalidateExam(current.examId);
  return { ok: true, id: questionId };
}

const outlineInputSchema = z.object({
  examId: z.string().uuid(),
  parentId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(220),
  description: z.string().trim().max(2_000).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0)
});

export async function createOutlineItem(input: unknown): Promise<MutationResult> {
  const actor = await requirePermission("exam:update");
  const parsed = outlineInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: "آیتم سرفصل معتبر نیست." };
  const row = await getDb().insert(examOutlineItems).values({ ...parsed.data, parentId: parsed.data.parentId ?? null, description: parsed.data.description ?? null }).returning({ id: examOutlineItems.id });
  await writeAuditLog({ actorUserId: actor.id, action: "CREATE", entityType: "exam_outline_item", entityId: row[0]?.id });
  invalidateExam(parsed.data.examId);
  return { ok: true, id: row[0]?.id };
}

export async function updateOutlineItem(outlineItemId: string, input: unknown): Promise<MutationResult> {
  const actor = await requirePermission("exam:update");
  const parsed = outlineInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: "آیتم سرفصل معتبر نیست." };
  await getDb().update(examOutlineItems).set({ title: parsed.data.title, description: parsed.data.description ?? null, parentId: parsed.data.parentId ?? null, sortOrder: parsed.data.sortOrder, updatedAt: new Date() }).where(eq(examOutlineItems.id, outlineItemId));
  await writeAuditLog({ actorUserId: actor.id, action: "UPDATE", entityType: "exam_outline_item", entityId: outlineItemId });
  invalidateExam(parsed.data.examId);
  return { ok: true, id: outlineItemId };
}

export async function moveOutlineItem(outlineItemId: string, parentId: string | null): Promise<MutationResult> {
  const actor = await requirePermission("exam:update");
  if (parentId === outlineItemId) return { ok: false, code: "VALIDATION_ERROR", message: "آیتم نمی‌تواند والد خودش باشد." };
  const row = await getDb().update(examOutlineItems).set({ parentId, updatedAt: new Date() }).where(eq(examOutlineItems.id, outlineItemId)).returning({ examId: examOutlineItems.examId });
  await writeAuditLog({ actorUserId: actor.id, action: "UPDATE", entityType: "exam_outline_item", entityId: outlineItemId, metadata: { parentId } });
  invalidateExam(row[0]?.examId);
  return { ok: true, id: outlineItemId };
}

export async function reorderOutlineItem(outlineItemId: string, direction: "up" | "down"): Promise<MutationResult> {
  const actor = await requirePermission("exam:update");
  const db = getDb();
  const current = await db.select().from(examOutlineItems).where(eq(examOutlineItems.id, outlineItemId)).limit(1).then((rows) => rows[0]);
  if (!current) return { ok: false, code: "NOT_FOUND", message: "آیتم پیدا نشد." };
  const rows = await db.select().from(examOutlineItems).where(and(eq(examOutlineItems.examId, current.examId), current.parentId ? eq(examOutlineItems.parentId, current.parentId) : isNull(examOutlineItems.parentId))).orderBy(asc(examOutlineItems.sortOrder));
  const index = rows.findIndex((row) => row.id === outlineItemId);
  const target = rows[index + (direction === "up" ? -1 : 1)];
  if (!target) return { ok: true, id: outlineItemId };
  await db.transaction(async (transaction) => {
    await transaction.update(examOutlineItems).set({ sortOrder: target.sortOrder }).where(eq(examOutlineItems.id, current.id));
    await transaction.update(examOutlineItems).set({ sortOrder: current.sortOrder }).where(eq(examOutlineItems.id, target.id));
  });
  await writeAuditLog({ actorUserId: actor.id, action: "UPDATE", entityType: "exam_outline_item", entityId: outlineItemId, metadata: { reorder: direction } });
  invalidateExam(current.examId);
  return { ok: true, id: outlineItemId };
}

export async function deleteOutlineItem(outlineItemId: string): Promise<MutationResult> {
  const actor = await requirePermission("exam:update");
  const row = await getDb().delete(examOutlineItems).where(eq(examOutlineItems.id, outlineItemId)).returning({ examId: examOutlineItems.examId });
  await writeAuditLog({ actorUserId: actor.id, action: "DELETE", entityType: "exam_outline_item", entityId: outlineItemId });
  invalidateExam(row[0]?.examId);
  return { ok: true, id: outlineItemId };
}

export async function duplicateQuestion(questionId: string): Promise<MutationResult> {
  const actor = await requirePermission("question:create");
  const source = await getQuestionWithAnswers(questionId);
  if (!source) return { ok: false, code: "NOT_FOUND", message: "پرسش پیدا نشد." };
  const created = await getDb().transaction(async (transaction) => {
    const [question] = await transaction.insert(questions).values({ ...source.question, id: undefined, prompt: `${source.question.prompt} (کپی)`, createdAt: new Date(), updatedAt: new Date() }).returning({ id: questions.id });
    if (!question) throw new Error("Question clone failed");
    if (source.options.length) await transaction.insert(questionOptions).values(source.options.map((option) => ({ ...option, id: undefined, questionId: question.id, createdAt: new Date(), updatedAt: new Date() })));
    if (source.acceptedAnswers.length) await transaction.insert(questionAcceptedAnswers).values(source.acceptedAnswers.map((answer) => ({ ...answer, id: undefined, questionId: question.id })));
    return question;
  });
  await writeAuditLog({ actorUserId: actor.id, action: "CREATE", entityType: "question", entityId: created.id, metadata: { duplicatedFrom: questionId } });
  invalidateExam(source.question.examId);
  return { ok: true, id: created.id };
}
