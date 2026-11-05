# CI and CD

## CI must stay green

- **Rule:** every pull request and every push to `main` passes CI; a red job is fixed, not skipped.
- **Reason:** CI is the gate that runs what the hooks do not: the OpenAPI contract check, `npm audit`, e2e tests on real containers, the migration task render test, the image build and the Trivy scan (`guide/release-management.md`, "Continuous Integration (CI)").
- **Where:** `.github/workflows/ci.yml` — `lint` (lint, knip, doctor, `openapi:check`, `npm audit --omit=dev --audit-level=high`) → `unit-tests` → `e2e-tests` → `build` (`scripts/render-migration-task.test.sh`, `docker build --target production`, Trivy HIGH/CRITICAL). `.github/workflows/codeql.yml` runs CodeQL on the same triggers and weekly.

## A v* tag deploys to production

- **Rule:** do not push `v*` tags or run `npm run release` without an explicit request.
- **Reason:** a tag starts the production deployment: image to ECR, a one-time migration task, a new ECS task definition (`guide/release-management.md`, "Continuous Deployment (CD)").
- **Where:** `.github/workflows/cd.yml` ("Release Docker Image to AWS ECR") runs on `push` of tags `v*`; `npm run release` creates and pushes the tag (`.release-it.json`, `git.push: true`). CD deploys `prod` only; dev has no CD workflow ([open-issues/dev-cd-workflows.md](../open-issues/dev-cd-workflows.md)). Its verification jobs (`lint`, `unit-tests`, `e2e-tests`, `build`) repeat the CI jobs step for step, because CI skips the `chore(release)` commit on `main`; keep both files in sync. A `concurrency` group without cancellation runs one tag at a time. The publish job stops at "Check deploy variables" when a GitHub variable from the terraform outputs is empty.

## AWS names come from terraform

- **Rule:** do not hard-code AWS resource names, subnets or roles in the workflows.
- **Reason:** the names are terraform outputs of the separate terraform repository, stored as GitHub variables of the `prod` environment; the deploy role trusts only jobs that declare `environment: prod` (`guide/release-management.md`, "GitHub Variables"). Only jobs that call AWS declare `environment: prod` and `id-token: write`; jobs that run `npm ci` get `contents: read` only, so a dependency install script cannot mint a deploy token.
- **Where:** `env:` blocks of `.github/workflows/cd.yml`, `rollback.yml` and `show-ecs-revisions.yml` (`vars.*`).

## E2E tests need Docker

- **Rule:** `npm run test:e2e` starts PostgreSQL and Redis with Testcontainers; it needs a running Docker daemon.
- **Where:** `test/setup/setup.global.ts`.
