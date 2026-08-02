import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { getServerEnvironment } from "@/lib/env/server";

export type DatabaseHealth = {
  ok: boolean;
  migrationTablePresent: boolean;
  migrationsCurrent: boolean;
  googleProviderConfigured: boolean;
  checkedAt: string;
};

export const EXPECTED_MIGRATION_TIMESTAMP = 1_785_702_845_573;

/** Safe readiness check: verifies connectivity and Auth.js relations without returning rows. */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const db = getDb();
  await Promise.all([
    db.select({ id: users.id }).from(users).limit(1),
    db.select({ userId: accounts.userId }).from(accounts).limit(1),
    db.select({ token: sessions.sessionToken }).from(sessions).limit(1),
    db.select({ identifier: verificationTokens.identifier }).from(verificationTokens).limit(1)
  ]);
  const migration = await db.execute(sql`select to_regclass('drizzle.__drizzle_migrations') is not null as present, coalesce((select max(created_at) from drizzle.__drizzle_migrations), 0)::bigint as latest`);
  const environment = getServerEnvironment();
  const migrationTablePresent = Boolean((migration.rows[0] as { present?: boolean } | undefined)?.present);
  const latestMigration = Number((migration.rows[0] as { latest?: string | number } | undefined)?.latest ?? 0);
  const migrationsCurrent = latestMigration >= EXPECTED_MIGRATION_TIMESTAMP;
  return {
    ok: migrationTablePresent && migrationsCurrent,
    migrationTablePresent,
    migrationsCurrent,
    googleProviderConfigured: Boolean(environment.AUTH_GOOGLE_ID && environment.AUTH_GOOGLE_SECRET),
    checkedAt: new Date().toISOString()
  };
}
