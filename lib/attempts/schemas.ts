import { z } from "zod";

export const startAttemptSchema = z.object({ examId: z.string().uuid() });
export const answerUpdateSchema = z.object({
  answers: z.array(z.object({ snapshotId: z.string().uuid(), value: z.unknown(), clientRevision: z.number().int().min(0) })).min(1).max(100)
});
export const submitAttemptSchema = z.object({
  answers: z.array(z.object({ snapshotId: z.string().uuid(), value: z.unknown(), clientRevision: z.number().int().min(0) })).max(100).optional()
});
