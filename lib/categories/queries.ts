import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { categories, exams } from "@/lib/db/schema";

export type CategoryTreeNode = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  locale: string;
  direction: "AUTO" | "LTR" | "RTL";
  status: "ACTIVE" | "HIDDEN" | "ARCHIVED";
  sortOrder: number;
  children: CategoryTreeNode[];
};

export type CategoryBreadcrumb = { id: string; name: string; slug: string };

type PublicCategoryPathNode = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  locale: string;
  direction: "AUTO" | "LTR" | "RTL";
};

async function resolveCategoryPath(segments: string[], includeHidden: boolean) {
  if (!segments.length) return null;
  const rows = await getDb().select({
    id: categories.id,
    parentId: categories.parentId,
    name: categories.name,
    slug: categories.slug,
    description: categories.description,
    locale: categories.locale,
    direction: categories.direction
  }).from(categories).where(includeHidden ? isNull(categories.deletedAt) : and(eq(categories.status, "ACTIVE"), isNull(categories.deletedAt)));
  const byParentAndSlug = new Map(rows.map((row) => [`${row.parentId ?? "root"}:${row.slug}`, row]));
  const breadcrumbs: CategoryBreadcrumb[] = [];
  let parentId: string | null = null;
  let category: PublicCategoryPathNode | undefined;

  for (const slug of segments) {
    category = byParentAndSlug.get(`${parentId ?? "root"}:${slug}`);
    if (!category) return null;
    breadcrumbs.push({ id: category.id, name: category.name, slug: category.slug });
    parentId = category.id;
  }

  return category ? { category, breadcrumbs } : null;
}

export async function getCategoryTree({ includeHidden = false }: { includeHidden?: boolean } = {}) {
  const db = getDb();
  const rows = await db.select({
    id: categories.id, parentId: categories.parentId, name: categories.name, slug: categories.slug,
    description: categories.description, locale: categories.locale, direction: categories.direction,
    status: categories.status, sortOrder: categories.sortOrder
  }).from(categories).where(includeHidden ? isNull(categories.deletedAt) : and(eq(categories.status, "ACTIVE"), isNull(categories.deletedAt))).orderBy(asc(categories.sortOrder), asc(categories.name));
  const nodes = new Map<string, CategoryTreeNode>(rows.map((row) => [row.id, { ...row, children: [] }]));
  const roots: CategoryTreeNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

export async function getCategoryByPath(segments: string[], { includeHidden = false }: { includeHidden?: boolean } = {}) {
  return (await resolveCategoryPath(segments, includeHidden))?.category ?? null;
}

export async function getPublicCategoryPath(segments: string[]) {
  return resolveCategoryPath(segments, false);
}

export async function getCategoryBreadcrumbs(categoryId: string) {
  const db = getDb();
  const breadcrumbs: Array<{ id: string; name: string; slug: string }> = [];
  let currentId: string | null = categoryId;
  const seen = new Set<string>();
  while (currentId && !seen.has(currentId)) {
    seen.add(currentId);
    const current: { id: string; parentId: string | null; name: string; slug: string } | undefined = await db.select({ id: categories.id, parentId: categories.parentId, name: categories.name, slug: categories.slug }).from(categories).where(eq(categories.id, currentId)).limit(1).then((rows) => rows[0]);
    if (!current) break;
    breadcrumbs.unshift({ id: current.id, name: current.name, slug: current.slug });
    currentId = current.parentId;
  }
  return breadcrumbs;
}

export async function getPublicCategoryPage(categoryId: string, providedBreadcrumbs?: CategoryBreadcrumb[]) {
  const db = getDb();
  const [children, publishedExams, breadcrumbs] = await Promise.all([
    db.select().from(categories).where(and(eq(categories.parentId, categoryId), eq(categories.status, "ACTIVE"), isNull(categories.deletedAt))).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select({ id: exams.id, slug: exams.slug, title: exams.title, shortDescription: exams.shortDescription, locale: exams.locale, direction: exams.direction, difficulty: exams.difficulty, durationSeconds: exams.durationSeconds, passingScorePercent: exams.passingScorePercent }).from(exams).where(and(eq(exams.categoryId, categoryId), eq(exams.status, "PUBLISHED"), isNull(exams.deletedAt))).orderBy(asc(exams.title)),
    providedBreadcrumbs ? Promise.resolve(providedBreadcrumbs) : getCategoryBreadcrumbs(categoryId)
  ]);
  return { children, exams: publishedExams, breadcrumbs };
}

export async function isCategoryDescendant(candidateId: string, ancestorId: string) {
  const db = getDb();
  let currentId: string | null = candidateId;
  const seen = new Set<string>();
  while (currentId && !seen.has(currentId)) {
    if (currentId === ancestorId) return true;
    seen.add(currentId);
    currentId = await db.select({ parentId: categories.parentId }).from(categories).where(eq(categories.id, currentId)).limit(1).then((rows) => rows[0]?.parentId ?? null);
  }
  return false;
}
