import { NextResponse } from "next/server";

import { saveAnswers } from "@/lib/attempts/service";
import { answerUpdateSchema } from "@/lib/attempts/schemas";
import { apiError, rateLimitRequest, requireJson } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const limited = await rateLimitRequest(request, "attempt-autosave", 240, 60_000);
  if (limited) return limited;
  try {
    requireJson(request);
    const input = answerUpdateSchema.parse(await request.json());
    return NextResponse.json(await saveAnswers((await params).attemptId, input.answers), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
