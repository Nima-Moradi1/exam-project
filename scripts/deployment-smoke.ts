import { CANONICAL_ORIGIN } from "@/lib/config/app-url";

async function main() {
  const origin = process.env.SMOKE_TEST_ORIGIN || CANONICAL_ORIGIN;
  const response = await fetch(origin, { redirect: "error", signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Canonical smoke check returned HTTP ${response.status}.`);
  const html = await response.text();
  if (!html.includes("آزمون‌خانه")) throw new Error("Canonical smoke check could not find the expected product title.");
  const readiness = await fetch(new URL("/api/health/ready", origin), { signal: AbortSignal.timeout(15_000) });
  if (!readiness.ok) throw new Error(`Runtime readiness check returned HTTP ${readiness.status}.`);
  console.log(`Deployment smoke check passed for ${origin}.`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Deployment smoke check failed.");
  process.exitCode = 1;
});
