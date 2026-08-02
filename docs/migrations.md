# Production migration and recovery procedure

1. Create a Neon branch or verified backup of the production database.
2. Run `pnpm db:migrate` with the production `DATABASE_URL_UNPOOLED` in a controlled pre-promotion job. Never use schema push.
3. Run `pnpm db:health`; promotion is blocked unless connectivity, Drizzle migration metadata, and all Auth.js relations pass.
4. Deploy code only after additive schema changes are available. For destructive changes, use separate expand, backfill, code-switch, and cleanup releases.
5. Run `pnpm deploy:verify` against the candidate origin, then inspect auth and database error monitoring.

If migration fails, keep the previous application deployment serving traffic, capture the migration identifier, and roll forward with a corrective additive migration. Restore the database branch only when a roll-forward is unsafe and the impact has been reviewed. Never edit a migration that has already reached a shared environment.
