import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthorizationError } from "@/lib/auth/guards";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export function requireJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new Error("UNSUPPORTED_MEDIA_TYPE");
}

export async function rateLimitRequest(request: Request, scope: string, limit: number, windowMs: number) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 120) || "unknown";
  const result = await consumeRateLimit(`${scope}:${forwarded}:${userAgent}`, limit, windowMs);
  if (result.allowed) return null;
  return NextResponse.json({ error: result.provider === "unavailable" ? "RATE_LIMIT_UNAVAILABLE" : "RATE_LIMITED", message: result.provider === "unavailable" ? "سرویس موقتاً در دسترس نیست. کمی بعد دوباره تلاش کنید." : `تعداد درخواست‌ها زیاد است. ${result.retryAfterSeconds} ثانیه بعد دوباره تلاش کنید.` }, { status: result.provider === "unavailable" ? 503 : 429, headers: { "Retry-After": String(result.retryAfterSeconds), "Cache-Control": "no-store" } });
}

export function apiError(error: unknown) {
  if (error instanceof AuthorizationError) return NextResponse.json({ error: error.code }, { status: error.code === "AUTH_REQUIRED" ? 401 : 403 });
  if (error instanceof ZodError) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  const code = error instanceof Error ? error.message : "INTERNAL_ERROR";
  const status = code === "NOT_FOUND" ? 404 : code.includes("EXPIRED") || code === "EXAM_NOT_READY" || code === "MAX_ATTEMPTS_REACHED" || code === "RETRY_COOLDOWN" ? 409 : code === "VALIDATION_ERROR" || code === "UNSUPPORTED_MEDIA_TYPE" ? 400 : 500;
  return NextResponse.json({ error: code }, { status });
}
