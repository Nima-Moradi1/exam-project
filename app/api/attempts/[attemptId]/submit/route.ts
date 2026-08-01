import { NextResponse } from "next/server";

import { submitAttempt } from "@/lib/attempts/service";
import { submitAttemptSchema } from "@/lib/attempts/schemas";
import { apiError, requireJson } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    requireJson(request);
    const input = submitAttemptSchema.parse(await request.json());
    return NextResponse.json(await submitAttempt((await params).attemptId, input.answers), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
