**Status:** 📝 draft · **Version:** 2.0.0 · **Date:** 2026-11-17 · **Modules:** features/users, common/guards, database-manager

# 02 — User provisioning

## Files

- `database-manager/schema.prisma` — `User.subject String @unique`; `email` and `name` removed. The migration SQL (add
  the column, backfill `subject` for the seeded users with the fixed Keycloak user ids from plan 02, then `NOT NULL` +
  unique, drop `email` and `name`) goes in the PR description; the owner lands the migration file
  (`docs/restrictions/database.md`).
- `database-manager/seeds/create-users/create-users.seed.ts` — `subject` per user instead of `email` and `name`.
- `src/features/users/users.service.ts` — `resolveBySubject(subject)`: Redis lookup, then
  `upsert` on `subject`, returns `User.id`.
- `src/common/guards/auth.guard.ts` — `verifyAccessToken` → `resolveBySubject` → `req.userId`.

## Tests

- `users.service.spec.ts`: unknown subject creates one row (two concurrent calls still one row); known subject reads
  the cache and does not query.
- `auth.guard.spec.ts`: the existing negative cases stay; 503 passes through; a valid token sets `req.userId` to the
  resolved id, not to `sub`.

Run: `npm test -- src/features/users src/common/guards`.
