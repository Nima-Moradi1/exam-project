import { count, desc, eq } from "drizzle-orm";

import { AdminBadge, AdminDataGrid } from "@/components/admin/data-grid";
import { ADMIN_PAGE_SIZE, getAdminPage, getTotalPages } from "@/lib/admin/pagination";
import { requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { examAttempts, exams, users } from "@/lib/db/schema";

export default async function AdminAttemptsPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  await requirePermission("attempt:read:any");
  const { page: requestedPage } = getAdminPage(await searchParams);
  const db = getDb();
  const total = Number((await db.select({ value: count() }).from(examAttempts))[0]?.value ?? 0);
  const page = Math.min(requestedPage, getTotalPages(total));
  const attempts = await db.select({ id: examAttempts.id, status: examAttempts.status, scorePercent: examAttempts.scorePercent, createdAt: examAttempts.createdAt, examTitle: exams.title, username: users.username }).from(examAttempts).innerJoin(exams, eq(examAttempts.examId, exams.id)).innerJoin(users, eq(examAttempts.userId, users.id)).orderBy(desc(examAttempts.createdAt)).limit(ADMIN_PAGE_SIZE).offset((page - 1) * ADMIN_PAGE_SIZE);
  return <section aria-labelledby="attempts-title"><span className="eyebrow"><i /> مدیریت</span><h1 id="attempts-title">تلاش‌های آزمون</h1><p className="admin-page-intro">آخرین وضعیت تلاش‌ها و نمره‌های ثبت‌شده در آزمون‌ها.</p><AdminDataGrid columns={["آزمون / کاربر", "وضعیت", "نمره", "زمان ثبت"]} itemName="تلاش‌های آزمون" page={page} total={total} emptyMessage="تلاشی برای نمایش وجود ندارد.">{attempts.map((attempt) => <tr key={attempt.id}><td><strong>{attempt.examTitle}</strong><small>{attempt.username ?? "کاربر حذف‌شده"}</small></td><td><AdminBadge tone={attempt.status === "COMPLETED" ? "success" : attempt.status === "IN_PROGRESS" ? "warning" : "neutral"}>{attempt.status}</AdminBadge></td><td>{attempt.scorePercent === null ? "—" : `${attempt.scorePercent.toLocaleString("fa-IR")}٪`}</td><td>{attempt.createdAt.toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" })}</td></tr>)}</AdminDataGrid></section>;
}
