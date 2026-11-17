**Status:** 📝 draft · **Version:** — (CI, load script and docs, no release) · **Date:** 2026-11-17 · **Modules:** CI, load, docs, guide (+ terraform guide for the drill)

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
| Rollback path | Forward-only migrations ([restrictions/database.md](../../restrictions/database.md)); `rollback.yml` switches the service to one of the last three task revisions; `show-ecs-revisions.yml` lists them. | The rule "a migration must not break the running version" is a convention only. Nothing checks it, and it matters twice: in the window between the migration task and the new tasks, and on every rollback. No runbook for a migration that fails half-way (Prisma marks it failed and blocks later deploys until `prisma migrate resolve`). |
| Graceful shutdown | `enableShutdownHooks`, `forceCloseConnections`; `ShutdownService`: drain 10 s, then wait for in-flight requests up to 20 s (`RequestTrackingService`), then close Prisma, Redis, tracing. Terraform: `stopTimeout = 60`, a validation that drain + in-flight < 60 s, ALB `deregistration_delay = 30`. | Never measured end to end. |
| Readiness probe | `/health` (readiness: DB ping + `shutdown` indicator that turns down on SIGTERM), `/health/live` (liveness, no deps), `/health/deps` (all deps). ALB target group checks `/health`; ECS: min healthy 100 %, max 200 %, circuit breaker, 60 s grace. | Never measured end to end. |
| Restore from backup | Terraform repo: 7-day point-in-time recovery, Multi-AZ, deletion protection, final snapshot; `guide/backup-and-dr.md` has the restore procedure and a quarterly drill checklist. | The drill has never been run (no recorded date or result); RTO figures are estimates. The checklist says "run the application migrations against the restored copy in dry-run mode", which Prisma does not have. |

Conclusion: nothing from the comment needs to be built from scratch. The value is in turning conventions and
estimates into checks and measured numbers.

## Goals

1. A pull request that adds a migration fails CI if the migration contains a destructive statement without an explicit
   opt-out, or if the latest released image stops working against the migrated schema.
2. A runbook for a failed migration task: how to read the error, `prisma migrate resolve --rolled-back|--applied`,
   re-run.
3. One measured rolling deploy under steady traffic, with zero failed requests, recorded with the numbers.
4. One real restore (point in time and snapshot) with the measured RTO recorded in the terraform guide, and the checklist fixed.

## Non-goals

- Down migrations. The forward-only rule stays.
- Automating the restore drill on a schedule. A first manual run comes first; automation is a separate idea if the
  manual run proves it worth the cost.
- Changes to the shutdown code or the health endpoints, unless the deploy measurement finds a dropped request. A fix
  would be its own `fix:` commit and patch release.
- Blue/green or canary deploys.

## Design

### 01 — Migration safety (CI)

- **Destructive SQL check.** A script `scripts/check-migrations.sh` runs on the migration folders added by the pull
  request (diff against `origin/main`) and fails on `DROP TABLE`, `DROP COLUMN`, `RENAME`, `ALTER COLUMN ... TYPE`,
  `SET NOT NULL` and `ADD COLUMN ... NOT NULL` without `DEFAULT`. A migration that really needs one carries a line
  `-- release-safety: allow <statement> (<reason>)` and is expected to ship as the "contract" half of an
  expand/contract pair, in a release after the code stopped using the column. The check never edits migration files
  (owner-only, [restrictions/database.md](../../restrictions/database.md)).
- **Previous release against the new schema.** A CI job, run only when `database-manager/migrations/` changes: start
  PostgreSQL and Redis, apply the pull request's migrations, build the image of the latest `v*` tag
  (`git worktree` + `docker build --target production`), start it against that database, seed, and run
  `load/k6-smoke.js` with one VU as a functional smoke. It covers both the rolling-deploy window and `rollback.yml`.
- **Runbook.** A "Failed migration" section in `guide/release-management.md`: where the logs are
  (`ECS_MIGRATION_LOG_GROUP`), how to tell a failed migration from a failed task, `migrate resolve`, and that the old
  tasks keep serving because "Deploy ECS" never started.

### 02 — Deploy under load (owner-run)

- `load/k6-deploy.js`: a `constant-arrival-rate` scenario against a deployed environment for the length of a deploy
  (default 10 min, `DURATION` env), mixing `GET /health/live` (unthrottled, catches connection-level drops) at about
  20 rps and authenticated `GET`/`POST /todos` below the per-IP limit (60 per minute in prod). Threshold:
  `http_req_failed: ['rate==0']`; every non-2xx is logged with its time.
- The owner starts it, then triggers a rolling replacement without a release: `rollback.yml` with the current revision
  (`--force-new-deployment` replaces every task). Evidence collected: k6 summary, ALB `HTTPCode_ELB_5XX_Count` and
  `HTTPCode_Target_5XX_Count` for the window, the "Shutdown started/completed" log lines of the old tasks.
- The result goes into the plan's conclusions and a short "Measured" note in `guide/release-management.md`.

### 03 — Restore drill (owner-run, terraform repo)

- Run the existing checklist in `terraform/guide/backup-and-dr.md` once, on dev or with throwaway identifiers.
- Backend part of the check on the restored copy: `prisma migrate status` (all migrations applied, none failed) and
  `load/k6-smoke.js` against an app task pointed at the restored instance.
- Replace "dry-run mode" in the checklist with `prisma migrate status`; add a "Drill log" table (date, restore type,
  time to `available`, data checks, issues) and record the first run. Replace the RTO estimate with the measured one.

## Open questions

1. **Previous-release check scope.** The destructive-SQL check is cheap. The "previous image against the new schema"
   job adds about 5–8 minutes to CI on migration pull requests. Both, or only the SQL check?
2. **Where the deploy measurement runs.** Dev has no CD workflow
   ([open-issues/dev-cd-workflows.md](../../open-issues/dev-cd-workflows.md)), so the realistic target is prod. Is a
   forced redeploy of prod acceptable for this, and should `THROTTLE_LIMIT` be raised for the window instead of keeping
   the API traffic under 1 rps?
3. **Restore drill cost and place.** An extra RDS instance for about an hour, run in dev or prod. Which environment,
   and should the drill log live only in the terraform repo?
4. **Priority.** Where this goes in the priority list relative to 002, 003 and 001 (all on hold).

## Decisions

_None yet._

## Agent's calls (to check)

1. No release: CI, a load script and docs only.
2. The destructive patterns list and the `-- release-safety: allow` opt-out comment, instead of a third-party
   migration linter (squawk), to avoid a new dependency.
3. The previous-release job builds the old image from the tag instead of pulling it from ECR, so CI on pull requests
   needs no AWS credentials ([restrictions/ci-cd.md](../../restrictions/ci-cd.md)).
4. The forced redeploy goes through `rollback.yml` with the current revision instead of a new workflow.
5. Plan 03 is tracked here because the comment was about the backend, but its doc changes land in the terraform repo.
