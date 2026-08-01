import { desc, eq } from "drizzle-orm";

import { requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { examAttempts, exams, users } from "@/lib/db/schema";

export default async function AdminAttemptsPage() {
  await requirePermission("attempt:read:any");
  const attempts = await getDb().select({ id: examAttempts.id, status: examAttempts.status, scorePercent: examAttempts.scorePercent, createdAt: examAttempts.createdAt, examTitle: exams.title, username: users.username }).from(examAttempts).innerJoin(exams, eq(examAttempts.examId, exams.id)).innerJoin(users, eq(examAttempts.userId, users.id)).orderBy(desc(examAttempts.createdAt)).limit(100);
  return <section aria-labelledby="attempts-title"><span className="eyebrow"><i /> مدیریت</span><h1 id="attempts-title">تلاش‌های آزمون</h1><div className="admin-tree">{attempts.map((attempt) => <div className="admin-tree__row" key={attempt.id}><span><strong>{attempt.examTitle}</strong><small>{attempt.username ?? "کاربر حذف‌شده"}</small></span><span>{attempt.status}</span><span>{attempt.scorePercent ?? "—"}٪</span></div>)}</div></section>;
}
