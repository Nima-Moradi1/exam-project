import { checkDatabaseHealth } from "@/lib/db/health";

async function main() {
  try {
    const health = await checkDatabaseHealth();
    if (!health.ok) throw new Error("Migration metadata is unavailable or behind the committed version.");
    console.log(JSON.stringify({ status: "ready", migrationTablePresent: health.migrationTablePresent, migrationsCurrent: health.migrationsCurrent, googleProviderConfigured: health.googleProviderConfigured, checkedAt: health.checkedAt }));
  } catch {
    console.error("Database readiness check failed. Verify the target database and run committed migrations before promotion.");
    process.exitCode = 1;
  }
}

void main();
