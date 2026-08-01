import { afterEach, describe, expect, it, vi } from "vitest";

import { consumeRateLimit } from "@/lib/security/rate-limit";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("rate limiting", () => {
  it("uses a bounded local fallback outside production when Upstash is not configured", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const key = `signup:test-${crypto.randomUUID()}`;
    expect(await consumeRateLimit(key, 2, 60_000)).toMatchObject({ allowed: true, provider: "local" });
    expect(await consumeRateLimit(key, 2, 60_000)).toMatchObject({ allowed: true, provider: "local" });
    expect(await consumeRateLimit(key, 2, 60_000)).toMatchObject({ allowed: false, provider: "local" });
  });

  it("fails closed in production when Upstash is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    await expect(consumeRateLimit(`signup:test-${crypto.randomUUID()}`, 5, 60_000)).resolves.toMatchObject({
      allowed: false,
      provider: "unavailable"
    });
  });
});
