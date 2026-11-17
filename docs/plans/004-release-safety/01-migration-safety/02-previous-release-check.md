**Status:** 📝 draft · **Version:** — (CI only) · **Date:** 2026-11-17 · **Modules:** CI, load, docs

# 02 — Previous release against the new schema

## Files

- `.github/workflows/ci.yml` — job `migration-compat`, on pull requests where `database-manager/migrations/**`
  changed, `contents: read` only:
  1. find the latest `v*` tag; check it out into a worktree; `docker build --target production` it;
  2. `docker compose` PostgreSQL and Redis; `prisma migrate deploy` from the pull request's checkout; seed;
  3. start the old image against that database with the config `load/docker-compose.load.yml` uses;
  4. run `load/k6-smoke.js` with one VU and a short duration (`VUS`, `DURATION` env) as a functional smoke.
- `load/k6-smoke.js` — read `VUS` and `DURATION` from env, defaults unchanged.
- `guide/release-management.md`, "Important Note About Migrations" — the job is what enforces the rule.
- `docs/restrictions/ci-cd.md` — the job in the CI chain.

## Tests

The job itself is the test. Proved once by a throwaway branch with a migration that drops a column the released code
reads: the job fails. A nullable `ADD COLUMN` passes. Both runs linked in the conclusions; the branch is deleted.
