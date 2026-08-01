"use server";

import { and, asc, count, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit/service";
import { requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { categories, exams } from "@/lib/db/schema";
import { isCategoryDescendant } from "./queries";
import { categoryInputSchema, categoryMoveSchema, categoryReorderSchema } from "./schemas";

type MutationResult = { ok: true; id?: string } | { ok: false; code: string; message: string };

function invalidateCategories() {
  revalidatePath("/");
  revalidatePath("/categories", "layout");
  revalidatePath("/admin/categories", "layout");
}

export async function createCategory(input: unknown): Promise<MutationResult> {
  const actor = await requirePermission("category:create");
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "دسته‌بندی معتبر نیست." };
  const db = getDb();
  if (parsed.data.parentId) {
    const parent = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.id, parsed.data.parentId), isNull(categories.deletedAt))).limit(1);
    if (!parent.length) return { ok: false, code: "NOT_FOUND", message: "دسته‌بندی والد پیدا نشد." };
  }
  const duplicate = await db.select({ id: categories.id }).from(categories).where(and(
    eq(categories.slug, parsed.data.slug),
    parsed.data.parentId ? eq(categories.parentId, parsed.data.parentId) : isNull(categories.parentId),
    isNull(categories.deletedAt)
  )).limit(1);
  if (duplicate.length) return { ok: false, code: "CONFLICT", message: "این اسلاگ در سطح انتخاب‌شده وجود دارد." };
  const inserted = await db.insert(categories).values({ ...parsed.data, createdByUserId: actor.id, updatedByUserId: actor.id }).returning({ id: categories.id });
  await writeAuditLog({ actorUserId: actor.id, action: "CREATE", entityType: "category", entityId: inserted[0]?.id, after: parsed.data });
  invalidateCategories();
  return { ok: true, id: inserted[0]?.id };
}

export async function updateCategory(categoryId: string, input: unknown): Promise<MutationResult> {
  const actor = await requirePermission("category:update");
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "دسته‌بندی معتبر نیست." };
  const db = getDb();
  const before = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1).then((rows) => rows[0]);
  if (!before) return { ok: false, code: "NOT_FOUND", message: "دسته‌بندی پیدا نشد." };
  if (parsed.data.parentId === categoryId || parsed.data.parentId && await isCategoryDescendant(parsed.data.parentId, categoryId)) return { ok: false, code: "VALIDATION_ERROR", message: "انتقال دسته‌بندی به خودش یا یکی از فرزندانش ممکن نیست." };
  await db.update(categories).set({ ...parsed.data, updatedByUserId: actor.id, updatedAt: new Date() }).where(eq(categories.id, categoryId));
  await writeAuditLog({ actorUserId: actor.id, action: "UPDATE", entityType: "category", entityId: categoryId, before: { name: before.name, slug: before.slug }, after: parsed.data });
  invalidateCategories();
  return { ok: true, id: categoryId };
}

export async function moveCategory(input: unknown): Promise<MutationResult> {
  const actor = await requirePermission("category:move");
  const parsed = categoryMoveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: "درخواست انتقال معتبر نیست." };
  if (parsed.data.parentId === parsed.data.categoryId || parsed.data.parentId && await isCategoryDescendant(parsed.data.parentId, parsed.data.categoryId)) return { ok: false, code: "VALIDATION_ERROR", message: "حرکت چرخه‌ای در درخت دسته‌بندی مجاز نیست." };
  await getDb().update(categories).set({ parentId: parsed.data.parentId, updatedByUserId: actor.id, updatedAt: new Date() }).where(eq(categories.id, parsed.data.categoryId));
  await writeAuditLog({ actorUserId: actor.id, action: "UPDATE", entityType: "category", entityId: parsed.data.categoryId, metadata: { parentId: parsed.data.parentId } });
  invalidateCategories();
  return { ok: true, id: parsed.data.categoryId };
}

export async function reorderCategory(input: unknown): Promise<MutationResult> {
  const actor = await requirePermission("category:move");
  const parsed = categoryReorderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: "درخواست مرتب‌سازی معتبر نیست." };
  const db = getDb();
  const current = await db.select().from(categories).where(eq(categories.id, parsed.data.categoryId)).limit(1).then((rows) => rows[0]);
  if (!current) return { ok: false, code: "NOT_FOUND", message: "دسته‌بندی پیدا نشد." };
  const siblings = await db.select().from(categories).where(and(current.parentId ? eq(categories.parentId, current.parentId) : isNull(categories.parentId), isNull(categories.deletedAt))).orderBy(asc(categories.sortOrder), asc(categories.name));
  const index = siblings.findIndex((item) => item.id === current.id);
  const target = siblings[index + (parsed.data.direction === "up" ? -1 : 1)];
  if (!target) return { ok: true, id: current.id };
  await db.transaction(async (transaction) => {
    await transaction.update(categories).set({ sortOrder: target.sortOrder, updatedByUserId: actor.id, updatedAt: new Date() }).where(eq(categories.id, current.id));
    await transaction.update(categories).set({ sortOrder: current.sortOrder, updatedByUserId: actor.id, updatedAt: new Date() }).where(eq(categories.id, target.id));
  });
  await writeAuditLog({ actorUserId: actor.id, action: "UPDATE", entityType: "category", entityId: current.id, metadata: { reorder: parsed.data.direction } });
  invalidateCategories();
  return { ok: true, id: current.id };
}

export async function archiveCategory(categoryId: string): Promise<MutationResult> {
  const actor = await requirePermission("category:delete");
  await getDb().update(categories).set({ status: "ARCHIVED", updatedByUserId: actor.id, updatedAt: new Date() }).where(eq(categories.id, categoryId));
  await writeAuditLog({ actorUserId: actor.id, action: "ARCHIVE", entityType: "category", entityId: categoryId });
  invalidateCategories();
  return { ok: true, id: categoryId };
}

export async function restoreCategory(categoryId: string): Promise<MutationResult> {
  const actor = await requirePermission("category:update");
  await getDb().update(categories).set({ status: "ACTIVE", updatedByUserId: actor.id, updatedAt: new Date() }).where(eq(categories.id, categoryId));
  await writeAuditLog({ actorUserId: actor.id, action: "RESTORE", entityType: "category", entityId: categoryId });
  invalidateCategories();
  return { ok: true, id: categoryId };
}

export async function deleteUnusedCategory(categoryId: string): Promise<MutationResult> {
  const actor = await requirePermission("category:delete");
  const db = getDb();
  const [childCount, examCount] = await Promise.all([
    db.select({ value: count() }).from(categories).where(and(eq(categories.parentId, categoryId), isNull(categories.deletedAt))).then((rows) => Number(rows[0]?.value ?? 0)),
    db.select({ value: count() }).from(exams).where(and(eq(exams.categoryId, categoryId), isNull(exams.deletedAt))).then((rows) => Number(rows[0]?.value ?? 0))
  ]);
  if (childCount || examCount) return { ok: false, code: "CONFLICT", message: "دسته‌بندی دارای فرزند یا آزمون است و فقط می‌تواند بایگانی شود." };
  await db.delete(categories).where(eq(categories.id, categoryId));
  await writeAuditLog({ actorUserId: actor.id, action: "DELETE", entityType: "category", entityId: categoryId });
  invalidateCategories();
  return { ok: true, id: categoryId };
}
