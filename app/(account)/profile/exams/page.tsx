import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { examAttempts, exams } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function ProfileExamsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const attempts = await getDb().select({ id: examAttempts.id, status: examAttempts.status, scorePercent: examAttempts.scorePercent, createdAt: examAttempts.createdAt, title: exams.title }).from(examAttempts).innerJoin(exams, eq(examAttempts.examId, exams.id)).where(eq(examAttempts.userId, session.user.id)).orderBy(desc(examAttempts.createdAt)).limit(30);
  return <main id="main-content" className="account-page page-shell"><section className="account-card" aria-labelledby="history-title"><Link className="account-back-link" href="/profile"><span aria-hidden="true">→</span> بازگشت به پروفایل</Link><h1 id="history-title">تاریخچهٔ آزمون‌ها</h1>{attempts.length ? <ul className="attempt-history">{attempts.map((attempt) => <li key={attempt.id}><div><strong>{attempt.title}</strong><span>{attempt.status} · {attempt.createdAt.toLocaleDateString("fa-IR")}</span></div>{attempt.status === "COMPLETED" ? <Link href={`/attempts/${attempt.id}/results`}>{attempt.scorePercent ?? 0}٪ و پاسخ‌نامه</Link> : <Link href={`/attempts/${attempt.id}`}>مشاهدهٔ تلاش</Link>}</li>)}</ul> : <p>هنوز آزمونی در تاریخچهٔ شما نیست.</p>}</section></main>;
}
