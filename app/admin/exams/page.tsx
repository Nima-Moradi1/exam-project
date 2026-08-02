import Link from "next/link";
import { asc, count } from "drizzle-orm";

import { AdminBadge, AdminDataGrid } from "@/components/admin/data-grid";
import { ADMIN_PAGE_SIZE, getAdminPage, getTotalPages } from "@/lib/admin/pagination";
import { requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { exams } from "@/lib/db/schema";
import { examStatusLabels, getDifficultyLabel } from "@/lib/exams/presentation";
import { inspectExamContent } from "@/lib/exams/content-quality";

export default async function AdminExamsPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  await requirePermission("exam:read");
  const { page: requestedPage } = getAdminPage(await searchParams);
  const db = getDb();
  const total = Number((await db.select({ value: count() }).from(exams))[0]?.value ?? 0);
  const page = Math.min(requestedPage, getTotalPages(total));
  const items = await db.select().from(exams).orderBy(asc(exams.title)).limit(ADMIN_PAGE_SIZE).offset((page - 1) * ADMIN_PAGE_SIZE);
  const diagnostics = items.map((exam) => ({ id: exam.id, issues: inspectExamContent(exam) }));
  const issueCount = diagnostics.reduce((sum, item) => sum + item.issues.length, 0);
  return <section aria-labelledby="admin-exams-title"><span className="eyebrow"><i /> محتوا</span><h1 id="admin-exams-title">آزمون‌ها</h1><p className="admin-page-intro">ساخت و ویرایش آزمون از actionهای مجاز مدیریت انجام می‌شود؛ انتشار تنها پس از اعتبارسنجی کیفیت محتوا و کلیدهای پاسخ ممکن است.</p><aside className="admin-quality-summary" aria-label="خلاصهٔ کیفیت محتوا"><strong>{issueCount.toLocaleString("fa-IR")}</strong><span>هشدار کیفیت در این صفحه</span><small>عنوان عمومی، توضیح تکراری، هدف یادگیری یا راهنمای ناقص پیش از انتشار باید اصلاح شود.</small></aside><AdminDataGrid columns={["آزمون", "سطح", "وضعیت", "کیفیت", "آخرین تغییر", "عملیات"]} itemName="آزمون‌ها" page={page} total={total} emptyMessage="هنوز آزمونی ساخته نشده است.">{items.map((exam) => { const issues = diagnostics.find((item) => item.id === exam.id)?.issues ?? []; return <tr key={exam.id}><td><strong>{exam.title}</strong><small dir="ltr">/{exam.slug}</small></td><td>{getDifficultyLabel(exam.difficulty)}</td><td><AdminBadge tone={exam.status === "PUBLISHED" ? "success" : exam.status === "ARCHIVED" ? "neutral" : "warning"}>{examStatusLabels[exam.status]}</AdminBadge></td><td><AdminBadge tone={issues.length ? "danger" : "success"}>{issues.length ? `${issues.length.toLocaleString("fa-IR")} هشدار` : "آماده"}</AdminBadge>{issues[0] && <small>{issues[0]}</small>}</td><td>{exam.updatedAt.toLocaleDateString("fa-IR")}</td><td><Link className="admin-table-link" href={`/admin/exams/${exam.id}/preview`}>پیش‌نمایش</Link></td></tr>; })}</AdminDataGrid></section>;
}
