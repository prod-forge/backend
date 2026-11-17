**Status:** 📝 draft · **Version:** — (docs only) · **Date:** 2026-11-17 · **Modules:** guide

# 02 — Failed migration runbook

## Files

- `guide/release-management.md` — a "Failed migration" section after "Database Migration Step":
  - the service keeps running the previous revision, because "Deploy ECS" needs "Run Migrations";
  - where to read the error (`ECS_MIGRATION_LOG_GROUP`, stream prefix `ecs`) and how to tell a failed SQL statement
    (Prisma `P3018`, then `P3009` on the next deploy) from a task that never started (exit code, stopped reason);
  - fix forward: a new migration plus `prisma migrate resolve --rolled-back <name>` when the failed one left no
    changes, or `--applied <name>` after finishing it by hand; how to run `resolve` as the same one-off ECS task with
    a different `command`;
  - re-run by pushing a new tag.

## Tests

Reproduced locally with `docker compose`: a migration that fails on its second statement, then `migrate status`,
`resolve`, `deploy`. The commands in the guide are the ones that ran.
