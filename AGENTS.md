# Exam Platform Repository Guide

## Commands

- Install dependencies: `pnpm install --frozen-lockfile`
- Run locally: `pnpm dev`
- Validate: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm check`
- Database: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:studio`

## Boundaries

- Keep database access, answer keys, auth secrets, hashes, and grading snapshots in server-only modules.
- Validate every external input with Zod and authorize every mutation on the server.
- Pass explicit public/admin DTOs to Client Components; never serialize database rows or grading keys directly.
- Prefer Server Components. Limit Client Components to interactive UI and browser APIs.
- Use CSS logical properties and set `lang`/`dir` at the content boundary for each exam.
- Preserve the warm green/orange visual system and accessible keyboard behavior.

## Data and security

- Commit generated Drizzle SQL migrations; do not use `drizzle-kit push` as a deployment strategy.
- The seed script must remain idempotent. Never commit `.env` files or credentials.
- Attempts are immutable snapshots and the server owns timing, state transitions, and grading.
