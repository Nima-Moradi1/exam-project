import { desc } from "drizzle-orm";

import { requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export default async function AuditLogsPage() {
  await requirePermission("audit:read");
  const logs = await getDb().select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
  return <section aria-labelledby="audit-title"><span className="eyebrow"><i /> امنیت</span><h1 id="audit-title">گزارش رویداد</h1><div className="admin-tree">{logs.map((log) => <div className="admin-tree__row" key={log.id}><span><strong>{log.action}</strong><small>{log.entityType} · {log.entityId}</small></span><span>{log.createdAt.toLocaleString("fa-IR")}</span></div>)}</div></section>;
}
