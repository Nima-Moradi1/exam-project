import { and, count, eq, gte } from "drizzle-orm";

import { requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { examAttempts, exams, users } from "@/lib/db/schema";

export default async function AdminDashboardPage() {
  await requirePermission("category:read");
  const db = getDb();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1_000);
  const [userTotal, publishedExams, draftExams, attemptsWeek] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(exams).where(eq(exams.status, "PUBLISHED")),
    db.select({ value: count() }).from(exams).where(eq(exams.status, "DRAFT")),
    db.select({ value: count() }).from(examAttempts).where(gte(examAttempts.createdAt, weekAgo))
  ]);
  const metrics = [["کاربران", userTotal[0]?.value ?? 0], ["آزمون منتشرشده", publishedExams[0]?.value ?? 0], ["پیش‌نویس‌ها", draftExams[0]?.value ?? 0], ["تلاش‌های ۷ روز اخیر", attemptsWeek[0]?.value ?? 0]];
  return <section aria-labelledby="admin-title"><span className="eyebrow"><i /> مدیریت</span><h1 id="admin-title">داشبورد</h1><div className="metric-grid">{metrics.map(([label, value]) => <article key={String(label)}><span>{String(label)}</span><strong>{Number(value).toLocaleString("fa-IR")}</strong></article>)}</div><p className="empty-state">شاخص‌های تکمیلی مانند نرخ تکمیل، میانگین نمره و موضوعات ضعیف پس از ثبت تلاش‌های واقعی محاسبه می‌شوند.</p></section>;
}
