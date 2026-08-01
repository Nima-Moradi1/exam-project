import "server-only";

import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { getServerEnvironment } from "@/lib/env/server";

type RateLimitBucket = { count: number; resetAt: number };
type RateLimitProvider = "local" | "upstash" | "unavailable";

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  provider: RateLimitProvider;
};

const localBuckets = new Map<string, RateLimitBucket>();

function isProductionRuntime() {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

function hashKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

function retryAfterSeconds(resetAt: number) {
  return Math.max(1, Math.ceil((resetAt - Date.now()) / 1_000));
}

/**
 * Applies a distributed sliding-window limit when Upstash is configured.
 * Development and test environments use an in-memory fallback; production
 * deliberately fails closed if the Redis configuration is absent or unhealthy.
 */
export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const environment = getServerEnvironment();
  const hasUpstashConfiguration = Boolean(environment.UPSTASH_REDIS_REST_URL && environment.UPSTASH_REDIS_REST_TOKEN);
  const safeKey = hashKey(key);

  if (hasUpstashConfiguration) {
    try {
      const redis = new Redis({
        url: environment.UPSTASH_REDIS_REST_URL,
        token: environment.UPSTASH_REDIS_REST_TOKEN
      });
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${Math.max(1, Math.ceil(windowMs / 1_000))} s`)
      });
      const result = await ratelimit.limit(safeKey);
      return {
        allowed: result.success,
        retryAfterSeconds: result.success ? 0 : retryAfterSeconds(result.reset),
        provider: "upstash"
      };
    } catch {
      return { allowed: false, retryAfterSeconds: 60, provider: "unavailable" };
    }
  }

  if (isProductionRuntime()) return { allowed: false, retryAfterSeconds: 60, provider: "unavailable" };

  const now = Date.now();
  const current = localBuckets.get(safeKey);
  if (!current || current.resetAt <= now) {
    localBuckets.set(safeKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0, provider: "local" };
  }
  if (current.count >= limit) {
    return { allowed: false, retryAfterSeconds: retryAfterSeconds(current.resetAt), provider: "local" };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0, provider: "local" };
}
