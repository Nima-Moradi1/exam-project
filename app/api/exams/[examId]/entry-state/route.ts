import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getExamEntryState } from "@/lib/attempts/service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ examId: string }> }) {
  const parsed = z.string().uuid().safeParse((await params).examId);
  if (!parsed.success) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ kind: "SIGNED_OUT" }, { headers: { "Cache-Control": "no-store" } });
  try {
    return NextResponse.json(await getExamEntryState(parsed.data, session.user.id), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
