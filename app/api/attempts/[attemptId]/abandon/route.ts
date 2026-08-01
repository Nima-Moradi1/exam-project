import { NextResponse } from "next/server";

import { abandonAttempt } from "@/lib/attempts/service";
import { apiError } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    return NextResponse.json(await abandonAttempt((await params).attemptId), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
