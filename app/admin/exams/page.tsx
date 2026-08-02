import Link from "next/link";
import { asc, count } from "drizzle-orm";

import { AdminBadge, AdminDataGrid } from "@/components/admin/data-grid";
import { ADMIN_PAGE_SIZE, getAdminPage, getTotalPages } from "@/lib/admin/pagination";
import { requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { exams } from "@/lib/db/schema";

export default async function AdminExamsPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  await requirePermission("exam:read");
  const { page: requestedPage } = getAdminPage(await searchParams);
  const db = getDb();
  const total = Number((await db.select({ value: count() }).from(exams))[0]?.value ?? 0);
  const page = Math.min(requestedPage, getTotalPages(total));
  const items = await db.select({ id: exams.id, title: exams.title, slug: exams.slug, status: exams.status, difficulty: exams.difficulty, updatedAt: exams.updatedAt }).from(exams).orderBy(asc(exams.title)).limit(ADMIN_PAGE_SIZE).offset((page - 1) * ADMIN_PAGE_SIZE);
  return <section aria-labelledby="admin-exams-title"><span className="eyebrow"><i /> محتوا</span><h1 id="admin-exams-title">آزمون‌ها</h1><p className="admin-page-intro">ساخت و ویرایش آزمون از actionهای مجاز مدیریت انجام می‌شود؛ انتشار تنها پس از اعتبارسنجی کلیدهای پاسخ ممکن است.</p><AdminDataGrid columns={["آزمون", "سطح", "وضعیت", "آخرین تغییر", "عملیات"]} itemName="آزمون‌ها" page={page} total={total} emptyMessage="هنوز آزمونی ساخته نشده است.">{items.map((exam) => <tr key={exam.id}><td><strong>{exam.title}</strong><small dir="ltr">/{exam.slug}</small></td><td>{exam.difficulty}</td><td><AdminBadge tone={exam.status === "PUBLISHED" ? "success" : "warning"}>{exam.status === "PUBLISHED" ? "منتشرشده" : "پیش‌نویس"}</AdminBadge></td><td>{exam.updatedAt.toLocaleDateString("fa-IR")}</td><td><Link className="admin-table-link" href={`/exams/${exam.slug}`}>پیش‌نمایش</Link></td></tr>)}</AdminDataGrid></section>;
}
