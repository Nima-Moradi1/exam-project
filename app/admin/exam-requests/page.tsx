import { desc, eq } from "drizzle-orm";

import { AdminBadge, AdminDataGrid } from "@/components/admin/data-grid";
import { updateExamRequestStatus } from "@/lib/exam-requests/actions";
import { requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { examRequests, users } from "@/lib/db/schema";

const labels: Record<string, string> = { PENDING: "در حال بررسی", REVIEWED: "بررسی شده", REJECTED: "رد شده", COMPLETED: "انجام شده" };
const tones: Record<string, "warning" | "info" | "danger" | "success"> = { PENDING: "warning", REVIEWED: "info", REJECTED: "danger", COMPLETED: "success" };

export default async function AdminExamRequestsPage() {
  await requirePermission("exam-request:read:any");
  const records = await getDb().select({ id: examRequests.id, title: examRequests.title, subject: examRequests.subject, level: examRequests.level, description: examRequests.description, status: examRequests.status, createdAt: examRequests.createdAt, userEmail: users.email, userName: users.displayName }).from(examRequests).innerJoin(users, eq(users.id, examRequests.userId)).orderBy(desc(examRequests.createdAt));
  return <section aria-labelledby="exam-requests-title"><span className="eyebrow"><i /> محتوا</span><h1 id="exam-requests-title">درخواست‌های آزمون</h1><p className="admin-page-intro">درخواست‌های کاربران را بررسی و وضعیت نهایی آن‌ها را ثبت کنید.</p><AdminDataGrid columns={["درخواست", "کاربر", "وضعیت", "عملیات"]} itemName="درخواست‌ها" page={1} total={records.length} emptyMessage="درخواستی ثبت نشده است.">{records.map((request) => <tr key={request.id}><td><strong>{request.title}</strong><small>{request.subject}{request.level ? ` · ${request.level}` : ""}</small><small>{request.description}</small></td><td dir="ltr">{request.userName || request.userEmail}</td><td><AdminBadge tone={tones[request.status]}>{labels[request.status]}</AdminBadge></td><td><form action={updateExamRequestStatus} className="admin-inline-form"><input type="hidden" name="id" value={request.id} /><select name="status" defaultValue={request.status} aria-label={`وضعیت ${request.title}`}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="submit">ثبت</button></form></td></tr>)}</AdminDataGrid></section>;
}
