"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit/service";
import { requireActiveUser, requirePermission } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { examRequests } from "@/lib/db/schema";
import { examRequestSchema, examRequestStatusSchema } from "./schemas";

export type ExamRequestActionResult = { ok: true } | { ok: false; message: string };

export async function createExamRequest(input: unknown): Promise<ExamRequestActionResult> {
  const user = await requireActiveUser();
  const parsed = examRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "درخواست معتبر نیست." };
  const [request] = await getDb().insert(examRequests).values({ ...parsed.data, level: parsed.data.level || null, userId: user.id }).returning({ id: examRequests.id });
  await writeAuditLog({ actorUserId: user.id, action: "CREATE", entityType: "exam_request", entityId: request?.id, after: parsed.data });
  revalidatePath("/profile/exam-requests");
  revalidatePath("/admin/exam-requests");
  return { ok: true };
}

export async function updateExamRequestStatus(formData: FormData) {
  const user = await requirePermission("exam-request:update");
  const id = String(formData.get("id") ?? "");
  const status = examRequestStatusSchema.safeParse(formData.get("status"));
  if (!id || !status.success) return;
  const db = getDb();
  const existing = await db.select({ status: examRequests.status }).from(examRequests).where(eq(examRequests.id, id)).limit(1).then((rows) => rows[0]);
  if (!existing) return;
  await db.update(examRequests).set({ status: status.data, reviewedByUserId: user.id, reviewedAt: new Date(), updatedAt: new Date() }).where(eq(examRequests.id, id));
  await writeAuditLog({ actorUserId: user.id, action: "STATUS_CHANGE", entityType: "exam_request", entityId: id, before: existing, after: { status: status.data } });
  revalidatePath("/admin/exam-requests");
  revalidatePath("/profile/exam-requests");
}
