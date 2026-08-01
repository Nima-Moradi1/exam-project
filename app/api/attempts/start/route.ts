import { NextResponse } from "next/server";

import { startAttempt } from "@/lib/attempts/service";
import { startAttemptSchema } from "@/lib/attempts/schemas";
import { apiError, requireJson } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    requireJson(request);
    const input = startAttemptSchema.parse(await request.json());
    return NextResponse.json(await startAttempt(input.examId), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
