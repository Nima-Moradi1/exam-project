import { count, desc } from "drizzle-orm";

import { AdminBadge, AdminDataGrid } from "@/components/admin/data-grid";
import { ADMIN_PAGE_SIZE, getAdminPage, getTotalPages } from "@/lib/admin/pagination";
import { requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  await requirePermission("audit:read");
  const { page: requestedPage } = getAdminPage(await searchParams);
  const db = getDb();
  const total = Number((await db.select({ value: count() }).from(auditLogs))[0]?.value ?? 0);
  const page = Math.min(requestedPage, getTotalPages(total));
  const logs = await db.select({ id: auditLogs.id, action: auditLogs.action, entityType: auditLogs.entityType, entityId: auditLogs.entityId, createdAt: auditLogs.createdAt }).from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(ADMIN_PAGE_SIZE).offset((page - 1) * ADMIN_PAGE_SIZE);
  return <section aria-labelledby="audit-title"><span className="eyebrow"><i /> امنیت</span><h1 id="audit-title">گزارش رویداد</h1><p className="admin-page-intro">رویدادهای مهم سیستم بدون نمایش داده‌های حساس ثبت‌شده‌اند.</p><AdminDataGrid columns={["رویداد", "موجودیت", "شناسه", "زمان"]} itemName="گزارش رویداد" page={page} total={total} emptyMessage="رویدادی ثبت نشده است.">{logs.map((log) => <tr key={log.id}><td><AdminBadge tone="info">{log.action}</AdminBadge></td><td>{log.entityType}</td><td><code>{log.entityId ? `${log.entityId.slice(0, 8)}…` : "—"}</code></td><td>{log.createdAt.toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" })}</td></tr>)}</AdminDataGrid></section>;
}
