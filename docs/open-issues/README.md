# Open Issues

Deferred known problems, so they are not rediscovered (or silently "fixed") in every session. Each entry links the GitHub issue that tracks it. When a problem is fixed, remove its line in the same change.

## GitHub issues

- [#16](https://github.com/prod-forge/backend/issues/16) — Remove the dead `SWAGGER_USERNAME` and `SWAGGER_PASSWORD` entries from `.env.common`.
- [#17](https://github.com/prod-forge/backend/issues/17) — Validate `DATABASE_HOST` in the database config.
- [#18](https://github.com/prod-forge/backend/issues/18) — Order describe blocks negative-first in three spec files.
- [#19](https://github.com/prod-forge/backend/issues/19) — Write the pending Prisma migration for the `Todo` search and sort indexes. See "Indexes" under `Todo` in [data-schema.md](../architecture/data-schema.md): the schema and the migrations have drifted, and migration files are written by the owner ([restrictions/database.md](../restrictions/database.md)).
- [#20](https://github.com/prod-forge/backend/issues/20) — Pin the RDS CA bundle in the `Dockerfile` with a checksum.
- [#21](https://github.com/prod-forge/backend/issues/21) — Pin GitHub Actions to commit SHAs.
- [#22](https://github.com/prod-forge/backend/issues/22) — Route Prometheus alerts to SNS through Alertmanager.
- [#23](https://github.com/prod-forge/backend/issues/23) — Add SLO burn-rate alerts for the API.

## Without an issue

- [main-branch-protection.md](main-branch-protection.md) — `main` has no branch protection, so failing CI checks do not block a merge.
- [dev-cd-workflows.md](dev-cd-workflows.md) — CD deploys prod only; the dev environment of the terraform repository has no deploy workflow.
- [moderate-audit-advisories.md](moderate-audit-advisories.md) — 5 moderate `glob`/`minimatch` advisories through `gcp-metadata` → `gaxios` → `rimraf`; below the `high` audit gate.

## Format

One line per problem: the issue link, its title and, when the docs already describe it, a link to that note. A problem without an issue gets a short file in this folder: what is wrong, where, why it is deferred, and what a fix needs.
