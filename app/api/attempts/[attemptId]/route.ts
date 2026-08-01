import { NextResponse } from "next/server";

import { getAttemptForUser } from "@/lib/attempts/service";
import { apiError } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    return NextResponse.json(await getAttemptForUser((await params).attemptId), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
