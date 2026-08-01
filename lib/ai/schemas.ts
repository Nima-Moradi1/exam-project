import { z } from "zod";

export const aiRecommendationSchema = z.object({
  summary: z.string().max(1_000),
  strengths: z.array(z.string().max(240)).max(8),
  weaknesses: z.array(z.string().max(240)).max(8),
  recommendedResourceIds: z.array(z.string().uuid()).max(8),
  studyPlan: z.array(z.object({ title: z.string().max(240), reason: z.string().max(500), estimatedMinutes: z.number().int().positive().max(600).optional() })).max(8)
});
