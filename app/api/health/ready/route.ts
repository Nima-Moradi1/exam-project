import { NextResponse } from "next/server";

import { checkDatabaseHealth } from "@/lib/db/health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const health = await checkDatabaseHealth();
    return NextResponse.json({ status: health.ok ? "ready" : "unavailable", checkedAt: health.checkedAt }, { status: health.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
