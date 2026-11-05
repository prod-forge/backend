# Goal

## What the project is

The backend of Prod Forge: a NestJS Todo API (PostgreSQL through Prisma, Redis for cache and rate limiting) taken from the first commit to production, and the main guide of the organization (`README.md`). The organization overview is at https://github.com/prod-forge; the clients are the separate frontend repository (https://github.com/prod-forge/frontend), the AWS infrastructure is the terraform repository (https://github.com/prod-forge/terraform).

- `src/api/` — controllers and DTOs, the transport layer.
- `src/features/` — business logic: services, repositories, entities, cache keys.
- `src/modules/`, `src/common/`, `src/error-handler/`, `src/logger/` — infrastructure and cross-cutting code.
- `database-manager/` — Prisma schema, migrations, seeds.
- `observability/` — the local Prometheus, Grafana, Loki, Promtail and Tempo stack.
- `.github/workflows/` — CI on every pull request and on `main`; CD to AWS ECS on `v*` tags.
- `guide/` — the human guide: why each decision was made.

The layers and the request lifecycle are in [architecture/overview.md](architecture/overview.md).

## What it must achieve

It answers one question: how do I build and operate a production-ready API? It covers quality gates, CI/CD, migrations, observability and rollback (`README.md`).

- Production-ready code that follows the existing architecture and conventions (`AGENTS.md`).
- Low-quality code must not be able to enter the repository: lint, type check, commit message, unused-code, architecture and unit test checks run in git hooks, and CI adds the OpenAPI contract check, a dependency audit, e2e tests on real PostgreSQL and Redis containers, and an image scan (`guide/ai-development.md`, `guide/release-management.md`).
- Unit tests keep at least 80% coverage; tests list negative cases first (`AGENTS.md`, [commands.md](commands.md#coverage)).
- The HTTP contract is committed as `docs/openapi.json` and checked against the code (`guide/documentation.md`).
- A release is a tag: the image is built, migrations run as a one-time ECS task, the service is updated, and a previous task revision can be restored (`guide/release-management.md`).
- Every decision is explained in `guide/`, and the docs are updated in the same change as the code (`AGENTS.md`).

Open work is listed in the public roadmap, [roadmap.md](../roadmap.md).
