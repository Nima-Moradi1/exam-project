import "server-only";

import { getDb } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export async function writeAuditLog(input: {
  actorUserId?: string | null;
  action: typeof auditLogs.$inferInsert["action"];
  entityType: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}) {
  await getDb().insert(auditLogs).values({
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    beforeJson: input.before ?? null,
    afterJson: input.after ?? null,
    metadataJson: input.metadata ?? null
  });
}
