import { after } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { productEventNames } from "@/lib/analytics/events";
import { rateLimitRequest } from "@/lib/security/request";

const route = z.string().regex(/^\/[a-zA-Z0-9/_-]*$/).max(240);
const payloadSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("vital"), name: z.enum(["CLS", "FCP", "INP", "LCP", "TTFB"]), value: z.number().finite().nonnegative(), rating: z.enum(["good", "needs-improvement", "poor"]), route, device: z.enum(["mobile", "desktop"]) }),
  z.object({ type: z.literal("product"), name: z.enum(productEventNames), examId: z.string().uuid().optional(), category: z.string().regex(/^[a-z0-9-]+$/).max(180).optional(), route, device: z.enum(["mobile", "desktop"]) })
]);

export async function POST(request: Request) {
  const limited = await rateLimitRequest(request, "telemetry", 120, 60_000);
  if (limited) return limited;
  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  const release = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || "local";
  after(() => console.info(JSON.stringify({ event: parsed.data, release })));
  return new NextResponse(null, { status: 204 });
}
