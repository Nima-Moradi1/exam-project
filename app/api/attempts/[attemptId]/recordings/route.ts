import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { requireActiveUser } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { attemptQuestionSnapshots, examAttempts } from "@/lib/db/schema";
import type { PublicQuestionDto } from "@/lib/exams/types";
import { vercelBlobProvider } from "@/lib/media/vercel-blob";
import { validateUpload } from "@/lib/media/validation";
import { apiError } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await params;
    const user = await requireActiveUser();
    const db = getDb();
    const attempt = await db.select({ id: examAttempts.id, status: examAttempts.status, expiresAt: examAttempts.expiresAt }).from(examAttempts).where(and(eq(examAttempts.id, attemptId), eq(examAttempts.userId, user.id))).limit(1).then((rows) => rows[0]);
    if (!attempt) throw new Error("NOT_FOUND");
    if (attempt.status !== "IN_PROGRESS" || attempt.expiresAt <= new Date()) throw new Error("ATTEMPT_NOT_ACTIVE");
    const formData = await request.formData();
    const file = formData.get("file");
    const snapshotId = String(formData.get("snapshotId") ?? "");
    if (!(file instanceof File) || !snapshotId) throw new Error("VALIDATION_ERROR");
    const snapshot = await db.select({ publicSnapshot: attemptQuestionSnapshots.publicSnapshot }).from(attemptQuestionSnapshots).where(and(eq(attemptQuestionSnapshots.id, snapshotId), eq(attemptQuestionSnapshots.attemptId, attemptId))).limit(1).then((rows) => rows[0]);
    const question = snapshot?.publicSnapshot as PublicQuestionDto | undefined;
    if (!question || question.settings.responseMode !== "AUDIO" || question.settings.skill !== "SPEAKING") throw new Error("VALIDATION_ERROR");
    const mimeType = file.type.split(";", 1)[0] || file.type;
    const recordingFile = new File([file], "speaking-response", { type: mimeType });
    const metadata = validateUpload(recordingFile);
    if (metadata.kind !== "AUDIO") throw new Error("UNSUPPORTED_MEDIA_TYPE");
    const durationSeconds = Number(formData.get("durationSeconds") ?? 0);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 15 * 60) throw new Error("VALIDATION_ERROR");
    const extension = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp4") ? "m4a" : mimeType.includes("mpeg") ? "mp3" : "webm";
    const stored = await vercelBlobProvider.upload(`exam-platform/attempt-recordings/${attemptId}/${snapshotId}/${Date.now()}.${extension}`, new File([recordingFile], `speaking-response.${extension}`, { type: mimeType }));
    return NextResponse.json({ kind: "AUDIO_RECORDING", url: stored.url, durationSeconds, mimeType }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
