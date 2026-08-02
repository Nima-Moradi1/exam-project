import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { AdminBadge } from "@/components/admin/data-grid";
import { getDb } from "@/lib/db";
import { examRequests } from "@/lib/db/schema";

const status: Record<string, { label: string; tone: "warning" | "info" | "danger" | "success" }> = { PENDING: { label: "در حال بررسی", tone: "warning" }, REVIEWED: { label: "بررسی شده", tone: "info" }, REJECTED: { label: "رد شده", tone: "danger" }, COMPLETED: { label: "انجام شده", tone: "success" } };

export const dynamic = "force-dynamic";

export default async function ProfileExamRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const requests = await getDb().select().from(examRequests).where(eq(examRequests.userId, session.user.id)).orderBy(desc(examRequests.createdAt));
  return <main id="main-content" className="account-page page-shell"><section className="account-card request-list" aria-labelledby="requests-title"><Link className="account-back-link" href="/profile"><span aria-hidden="true">→</span> بازگشت به حساب</Link><div className="request-list__heading"><div><span className="eyebrow"><i /> درخواست‌های من</span><h1 id="requests-title">پیگیری درخواست آزمون</h1><p>وضعیت بررسی هر پیشنهاد در اینجا به‌روز می‌شود.</p></div><Link className="primary-button" href="/exam-request">درخواست جدید</Link></div>{requests.length ? <div className="request-list__items">{requests.map((request) => { const item = status[request.status]; return <article key={request.id}><div><h2>{request.title}</h2><p>{request.subject}{request.level ? ` · ${request.level}` : ""}</p></div><AdminBadge tone={item.tone}>{item.label}</AdminBadge><p className="request-list__description">{request.description}</p><small>{request.createdAt.toLocaleDateString("fa-IR")}</small></article>; })}</div> : <div className="empty-state"><p>هنوز درخواستی ثبت نکرده‌اید.</p><Link className="primary-button" href="/exam-request">ثبت اولین درخواست</Link></div>}</section></main>;
}
