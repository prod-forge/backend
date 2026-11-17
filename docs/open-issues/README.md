# Open Issues

Deferred known problems, so they are not rediscovered (or silently "fixed") in every session. Each entry links the GitHub issue that tracks it. When a problem is fixed, remove its line in the same change.

## GitHub issues

- [#16](https://github.com/prod-forge/backend/issues/16) — Remove the dead `SWAGGER_USERNAME` and `SWAGGER_PASSWORD` entries from `.env.common`.
- [#19](https://github.com/prod-forge/backend/issues/19) — Write the pending Prisma migration for the `Todo` search and sort indexes. See "Indexes" under `Todo` in [data-schema.md](../architecture/data-schema.md): the schema and the migrations have drifted, and migration files are written by the owner ([restrictions/database.md](../restrictions/database.md)).
- [#20](https://github.com/prod-forge/backend/issues/20) — Pin the RDS CA bundle in the `Dockerfile` with a checksum.
- [#21](https://github.com/prod-forge/backend/issues/21) — Pin GitHub Actions to commit SHAs.
- [#22](https://github.com/prod-forge/backend/issues/22) — Route Prometheus alerts to SNS through Alertmanager.
- [#23](https://github.com/prod-forge/backend/issues/23) — Add SLO burn-rate alerts for the API.
- [#34](https://github.com/prod-forge/backend/issues/34) — Document `POST /api/v1/todos` as 201, not 200.
- [#35](https://github.com/prod-forge/backend/issues/35) — Match `LOG_EXCLUDE_ENDPOINTS` against the path, not the URL with the query string.
- [#36](https://github.com/prod-forge/backend/issues/36) — Count `delByPattern` in `cache_operations_total`.
- [#40](https://github.com/prod-forge/backend/issues/40) — Document the 429 throttling response in OpenAPI.
- [#48](https://github.com/prod-forge/backend/issues/48) — Reject `null` for `title` and `completed` with a 422 instead of a 500.
- [#49](https://github.com/prod-forge/backend/issues/49) — Reject invalid boolean env values instead of reading them as `true` or `false`.
- [#50](https://github.com/prod-forge/backend/issues/50) — Require positive integers for numeric env values.
- [#51](https://github.com/prod-forge/backend/issues/51) — Make `DATABASE_LOG_LEVELS` write Prisma log events to the logger.
- [#52](https://github.com/prod-forge/backend/issues/52) — Count guard-rejected requests (401, 429) in `http_requests_total`.
- [#53](https://github.com/prod-forge/backend/issues/53) — Log the client trace id for mobile client logs, as for web logs.
- [#54](https://github.com/prod-forge/backend/issues/54) — Accept the `Bearer` auth scheme case-insensitively.

## Without an issue

- [main-branch-protection.md](main-branch-protection.md) — `main` has no branch protection, so failing CI checks do not block a merge.
- [dev-cd-workflows.md](dev-cd-workflows.md) — CD deploys prod only; the dev environment of the terraform repository has no deploy workflow.
- [moderate-audit-advisories.md](moderate-audit-advisories.md) — 5 moderate `glob`/`minimatch` advisories through `gcp-metadata` → `gaxios` → `rimraf`; below the `high` audit gate.

## Format

One line per problem: the issue link, its title and, when the docs already describe it, a link to that note. A problem without an issue gets a short file in this folder: what is wrong, where, why it is deferred, and what a fix needs.
