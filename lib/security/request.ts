import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthorizationError } from "@/lib/auth/guards";

export function requireJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new Error("UNSUPPORTED_MEDIA_TYPE");
}

export function apiError(error: unknown) {
  if (error instanceof AuthorizationError) return NextResponse.json({ error: error.code }, { status: error.code === "AUTH_REQUIRED" ? 401 : 403 });
  if (error instanceof ZodError) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  const code = error instanceof Error ? error.message : "INTERNAL_ERROR";
  const status = code === "NOT_FOUND" ? 404 : code.includes("EXPIRED") || code === "EXAM_NOT_READY" || code === "MAX_ATTEMPTS_REACHED" || code === "RETRY_COOLDOWN" ? 409 : code === "VALIDATION_ERROR" || code === "UNSUPPORTED_MEDIA_TYPE" ? 400 : 500;
  return NextResponse.json({ error: code }, { status });
}
