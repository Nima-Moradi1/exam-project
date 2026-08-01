import "server-only";

type RateLimitBucket = { count: number; resetAt: number };

const localBuckets = new Map<string, RateLimitBucket>();

/**
 * Local fallback for development only. Configure Upstash in production before
 * relying on a distributed deployment for sensitive endpoints.
 */
export function consumeLocalRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = localBuckets.get(key);
  if (!current || current.resetAt <= now) {
    localBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)) };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
