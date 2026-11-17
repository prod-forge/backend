**Status:** 📝 draft · **Version:** — (CI, load script and docs, no release) · **Date:** 2026-11-17 · **Modules:** scripts, CI, load, docs, guide

# Design: release safety

## Intent

A review comment the owner wants to evaluate:

> the dull parts would add more than load testing: migrations running in ci with a rollback path, graceful shutdown
> plus a readiness probe so rolling deploys don't drop in-flight requests, and one real restore-from-backup against the
> terraform stack.

## Current state

| Item from the comment | What exists | Gap |
| --- | --- | --- |
| Migrations in CI | `cd.yml` job "Run Migrations": a one-off ECS task (`prisma migrate deploy`) with the app's roles, secrets and private subnets, before "Deploy ECS"; the deploy does not start if the task exits non-zero. CI tests the task render (`scripts/render-migration-task.test.sh`); e2e applies all migrations on Testcontainers (`test/setup/setup.global.ts`). | — |
| Rollback path | Forward-only migrations ([restrictions/database.md](../../restrictions/database.md)); `rollback.yml` switches the service to one of the last three task revisions. | "A migration must not break the running version" is a convention only; nothing checks it. No runbook for a migration that fails half-way (Prisma marks it failed and blocks later deploys until `prisma migrate resolve`). |
| Graceful shutdown | `enableShutdownHooks`, `forceCloseConnections`; `ShutdownService`: drain 10 s, wait for in-flight requests up to 20 s, then close Prisma, Redis, tracing. Terraform: `stopTimeout = 60` with a validation, ALB `deregistration_delay = 30`. | Never measured under traffic. |
| Readiness probe | `/health` (DB ping + `shutdown` indicator, down after SIGTERM), `/health/live`, `/health/deps`. The ALB checks `/health`; ECS min healthy 100 %, max 200 %, circuit breaker. | Never measured under traffic. |
| Restore from backup | Terraform repo: 7-day point-in-time recovery, Multi-AZ, final snapshot, restore procedure and drill checklist in `guide/backup-and-dr.md`. | Never run. Out of scope here: it needs AWS spend. |

Nothing from the comment needs to be built from scratch.

## Goals

1. A pull request that adds a migration with a destructive statement fails CI unless the migration carries an explicit
   opt-out.
2. A runbook for a failed migration task.
3. One local measurement: the app is stopped (SIGTERM) under steady traffic, requests already in flight complete,
   `/health` turns down during the drain.

## Non-goals

- Anything that needs a deploy or extra AWS resources: a rolling deploy under load in AWS, the restore drill.
- A CI job that runs the previous release against the new schema. The SQL check catches the common cases for far less
  work; revisit if a migration slips through.
- Down migrations, blue/green or canary deploys.
- Changes to the shutdown code, unless the measurement finds a dropped request (then a separate `fix:`).

## Design

### 01 — Migration safety

- `scripts/check-migrations.sh` checks the `migration.sql` files added since `origin/main` and fails on
  `DROP TABLE`, `DROP COLUMN`, `RENAME`, `ALTER COLUMN ... TYPE`, `SET NOT NULL` and
  `ADD COLUMN ... NOT NULL` without `DEFAULT`. A migration that really needs one carries
  `-- release-safety: allow <statement> (<reason>)` and ships as the "contract" half of an expand/contract pair. The
  check never edits migration files ([restrictions/database.md](../../restrictions/database.md)).
- A "Failed migration" section in `guide/release-management.md`.

### 02 — Shutdown under load (local)

- `load/k6-shutdown.js` against `docker compose` with the load override: steady traffic including a slow request,
  while the app container gets `docker stop` (SIGTERM). Locally there is no load balancer to stop routing new
  connections, so the bar is: no request that started before SIGTERM fails, and `/health` answers 503 during the
  drain.

## Open questions

None.

## Decisions

- 2026-11-17 — No deploys and no extra AWS spend: only checks that run in CI or locally. Keep the plan small.

## Agent's calls (to check)

1. No release: CI, a load script and docs only.
2. Own pattern list and opt-out comment instead of a third-party migration linter (squawk), to avoid a new dependency.
3. The previous-release CI job and the restore drill are dropped (non-goals), not deferred into another plan.
4. The "dry-run mode" line in the terraform drill checklist (Prisma has no dry-run; `prisma migrate status` is the
   equivalent) is left for a one-line fix in the terraform repo, outside this plan.
