# Commands

<!-- cspell:ignore commitlintrc lintstagedrc -->

Commands for working with the project. How to add code is in [architecture/patterns.md](architecture/patterns.md).

## Prerequisites

| Tool       | Version   | Notes                                  |
| ---------- | --------- | -------------------------------------- |
| Node.js    | ≥ 24.15.0 | Enforced in `package.json` (`engines`) |
| npm        | ≥ 11.0.0  | Enforced in `package.json` (`engines`) |
| Docker     | any       | For local infra                        |
| PostgreSQL | 18        | Or via docker-compose                  |
| Redis      | 8         | Or via docker-compose                  |

CI and the Docker image use Node.js 26.13.0, the current LTS (`NODE_VERSION` in the workflows, `node:26.13.0-alpine` in the `Dockerfile`). Local development on Node 24.15 or newer still works.

---

## Setup

### 1. Install dependencies

```bash
npm install
npm run db:generate
```

`npm install` does not generate the Prisma client (`database-manager/generated/` is gitignored), and there is no postinstall hook. Run `npm run db:generate` once on a fresh clone; without it `npm run lint` and `npm test` fail with `Cannot find module '.../database-manager/generated/client'`. CI and the Dockerfile run it already.

### 2. Start infrastructure

```bash
docker-compose up -d database cache
```

This starts:

- PostgreSQL on `localhost:5332`
- Redis on `localhost:6379`

`docker-compose.yml` falls back to `DATABASE_USER=user`, `DATABASE_PASSWORD=user`, `DATABASE_NAME=app` (the `.env.common` values) and treats `.env` as optional, so this works on a clean clone. Set the variables in `.env` to override them.

### 3. Configure environment

The app reads `.env` and `.env.common`; a variable set in `.env` wins over `.env.common`. `.env.common` holds non-secret defaults only; put secrets (e.g. `DATABASE_PASSWORD`) in `.env`. Neither file is copied into the Docker image: in production, env comes from the ECS task definition / Secrets Manager.

Key variables to verify:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5332       # Docker-mapped port
DATABASE_USER=user
DATABASE_PASSWORD=user
DATABASE_NAME=app

REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Run migrations and generate Prisma client

On a clean clone, create `.env` with `DATABASE_PORT=5332` first: `.env.common` points at 5432, the compose database is mapped to 5332.

```bash
npm run db:init
```

This runs `prisma migrate deploy` then `prisma generate`. For the compose database also run `npm run db:seed` (required by `scripts/verify-observability.sh`).

### 5. Start the dev server

```bash
npm run start:dev        # watch mode
npm run start:debug      # watch + Node debugger on port 9229
npm run start            # single run (no watch)
```

App starts on `http://localhost:3000` by default.

### 6. Open Swagger

```
http://localhost:3000/docs
```

Use the Bearer auth input to authenticate. Issue a token for a seeded user:

```bash
npm run token:issue -- <userId>
```

Or call `POST /api/v1/auth/login` with a seeded email (for example `user1@example.com`) and use the returned `accessToken`.

---

## Environment Variables

All variables are validated at startup with `class-validator`. Missing required vars crash the process with a clear error.

Defaults are the code defaults (`.env.common` sets local values for some). Production values come from the ECS task definition; see `guide/configuration-management.md` for the full mapping.

| Variable                          | Default                | Description                                       |
| --------------------------------- | ---------------------- | ------------------------------------------------- |
| `NODE_ENV`                        | `development`          | `development` \| `production` \| `test`           |
| `APP_PORT`                        | `3000`                 | HTTP listen port                                  |
| `APP_HOST`                        | `0.0.0.0`              | HTTP listen host                                  |
| `SHUTDOWN_DRAIN_MS`               | `10000`                | Readiness returns 503 before the server closes    |
| `SHUTDOWN_INFLIGHT_TIMEOUT_MS`    | `20000`                | Max wait for in-flight requests on shutdown       |
| `APP_NAME`                        | `package.json` name    | Used in logs and Swagger title                    |
| `APP_VERSION`                     | `package.json` version | Returned by `GET /api/version`                    |
| `API_PREFIX`                      | `api`                  | Global route prefix                               |
| `API_ALLOWED_ORIGINS`             | `[]`                   | JSON array of allowed CORS origins                |
| `API_ALLOWED_NON_BROWSER_ORIGINS` | `true`                 | Allow requests with no `Origin` header            |
| `LOG_LEVEL`                       | `info`                 | `trace` \| `info` \| `warn` \| `error`            |
| `LOG_PRETTY`                      | `true`                 | Enable pino-pretty colored output                 |
| `SWAGGER_ENABLED`                 | `true`                 | Toggle Swagger UI (disabled in production)        |
| `SWAGGER_ENDPOINT`                | `docs`                 | Swagger UI path                                   |
| `DATABASE_HOST`                   | —                      | PostgreSQL host                                   |
| `DATABASE_PORT`                   | —                      | PostgreSQL port                                   |
| `DATABASE_USER`                   | —                      | PostgreSQL username                               |
| `DATABASE_PASSWORD`               | —                      | PostgreSQL password                               |
| `DATABASE_NAME`                   | —                      | PostgreSQL database name                          |
| `DATABASE_SSL`                    | `false`                | `sslmode=verify-full` (`require` for migrate)     |
| `DATABASE_LOG_LEVELS`             | `[]`                   | Prisma log levels                                 |
| `DATABASE_FAIL_FAST`              | `true`                 | Exit on DB connection failure at startup          |
| `DATABASE_POOL_MAX`               | `10`                   | Max connections in the Prisma pg pool             |
| `DATABASE_CONNECT_TIMEOUT_MS`     | `5000`                 | Pool connection timeout                           |
| `DATABASE_STATEMENT_TIMEOUT_MS`   | `5000`                 | Postgres `statement_timeout` per query            |
| `REDIS_ENABLED`                   | `true`                 | Enable Redis (cache + throttler)                  |
| `REDIS_HOST`                      | `localhost`            | Redis host                                        |
| `REDIS_PORT`                      | `6379`                 | Redis port                                        |
| `REDIS_TLS`                       | `false`                | `true`/`false` only; TLS with Node's default CAs  |
| `REDIS_PASSWORD`                  | —                      | Optional AUTH token (warns if TLS on in prod)     |
| `THROTTLE_TTL`                    | `60000`                | Rate-limit window in milliseconds                 |
| `THROTTLE_LIMIT`                  | `60`                   | Max requests per window (per user, else per IP)   |
| `THROTTLE_ENABLED`                | `true`                 | Set `false` to disable rate limiting              |
| `TRUST_PROXY`                     | `0`                    | Express trust-proxy hops; `1` behind ALB          |
| `JWT_SECRET`                      | required, 32+ chars    | HS256 signing key for access tokens               |
| `JWT_TTL`                         | `3600`                 | Access token lifetime in seconds                  |
| `SENTRY_ENABLED`                  | `false`                | Sentry on only with `SENTRY_DSN` and `true`       |
| `SENTRY_DSN`                      | `""`                   | Sentry DSN (needed when enabled)                  |
| `SENTRY_IGNORED_ERRORS`           | `[]`                   | JSON array of error names not sent to Sentry      |
| `LOG_EXCLUDE_ENDPOINTS`           | `[]`                   | JSON array of routes not logged                   |
| `OTEL_EXPORTER_OTLP_ENDPOINT`     | —                      | OTLP/HTTP trace endpoint; tracing off when unset  |
| `HEALTH_CHECK_TRIGGER_MS`         | `15000`                | Min interval between DB pings on /metrics scrapes |

---

## Scripts

```bash
# Development
npm run start:dev          # Start with file watch
npm run start:debug        # Start with debugger

# Build & Production
npm run build              # Compile to dist/
npm run start:prod         # Run compiled output

# Database
npm run db:generate        # Regenerate Prisma client
npm run db:init            # Deploy migrations + generate
npm run db:migrate -- name # Create a new migration
npm run db:migration:deploy # Deploy existing migrations
npm run db:migration:apply # Wait for the DB, then deploy migrations
npm run db:seed            # Run seed script

# Code quality
npm run lint               # TypeScript + ESLint check
npm run lint:ts            # tsc --noEmit only
npm run lint:code          # ESLint only
npm run format             # Prettier + ESLint auto-fix
npm run knip               # Dead code / unused exports check
npm run doctor             # nestjs-doctor architecture checks
npm run openapi:export     # Regenerate docs/openapi.json (run after any HTTP contract change)
npm run openapi:check      # Fail if docs/openapi.json is out of date

# Testing
npm test                   # Unit tests
npm run test:cov           # Unit tests with coverage
npm run test:watch         # Unit tests in watch mode
npm run test:debug         # Unit tests in band with the Node inspector
npm run test:e2e           # E2E tests (Testcontainers)
npm run test:e2e:cov       # E2E with coverage
npm run test:load          # k6 smoke test (load/k6-smoke.js; needs k6)

# Tokens
npm run token:issue -- <userId>   # Sign a JWT for a user id
```

---

## Testing

### Unit tests

Located co-located with source files as `*.spec.ts`. Run with Jest + ts-jest.

```bash
npm test
# Run a single file:
npx jest src/features/todos/todos.service.spec.ts
```

Test mocks are shared from `src/mocks/`:

- `prismaMock` — fakes all Prisma model methods
- `cacheStorageMock` — fakes all `CacheStorage` methods

### E2E tests

Located in `test/`. Use `@testcontainers/postgresql` and `@testcontainers/redis` — real Docker containers are spun up per suite. Requires Docker.

```bash
npm run test:e2e
```

### Load tests

```bash
npm run test:load          # k6 run load/k6-smoke.js; needs k6 and a migrated, seeded database
```

`load/docker-compose.load.yml` and `guide/testing.md` ("Load Testing") describe the setup.

### Coverage

`jest.coverageThreshold` in `package.json` requires 80% for branches, functions, lines and statements; `npm run test:cov` fails below it.

The following are excluded from coverage (see `jest.collectCoverageFrom` in `package.json`):

- `main.ts`, `app.setup.ts`, `app.swagger.ts`
- `*.module.ts`, `*.spec.ts`
- `*.config.ts`, `*.interface.ts`, `*.enum.ts`, `*.dto.ts`, `*.entity.ts`
- DI type files, constants files

---

## Code Quality Gates

Husky hooks run these automatically.

On every commit (`pre-commit`, `npm run pre-commit`, which runs lint-staged with `.lintstagedrc.cjs`):

- `prettier --write` on staged `*.md`, `*.ts` and `*.json`
- `eslint --fix` on staged `*.ts` and `*.json` (includes import-order, perfectionist, sonarjs, unicorn, check-file rules)
- `tsc --noEmit` when a `*.ts` file is staged

On the commit message (`commit-msg`): `commitlint` enforces Conventional Commits, and AI attribution trailers are rejected.

On push (`pre-push`): `npm run knip && npm run doctor && npm run test:cov` (unit tests with the 80% coverage threshold).

To run all checks manually:

```bash
npm run lint && npm run format
```

---

## Docker

### Build and run locally

```bash
docker-compose up --build production
```

The image build is described in [architecture/overview.md](architecture/overview.md#docker-image).

### Full observability stack

```bash
./scripts/verify-observability.sh   # docker compose up -d --build, then end-to-end checks; needs curl and jq
docker compose down                 # volumes are kept
```

Starts: app · PostgreSQL · Redis · Prometheus · Grafana · Loki · Promtail · Tempo, all on the `backend` network.
Migrate and seed the compose database first (`npm run db:migration:deploy && npm run db:seed`): the script logs in as
`user1@example.com`.

- Grafana: `http://localhost:3001` (admin/admin), 3 provisioned dashboards
- Prometheus: `http://localhost:9090`, job `nestjs-app`, alert rules from `observability/prometheus/alerts.yml`
- Tempo: `http://localhost:3200`; Loki: `http://localhost:3100`

The `production` service overrides `DATABASE_HOST`, `DATABASE_PORT`, `REDIS_HOST`, `LOG_PRETTY=false` and
`OTEL_EXPORTER_OTLP_ENDPOINT` via compose `environment:`. `JWT_SECRET` falls back to the non-secret
`local-dev-only-jwt-secret-0123456789` when `.env` does not set it.

Check alert rules after editing: `docker run --rm --entrypoint promtool -v "$PWD/observability/prometheus:/etc/prometheus:ro" prom/prometheus:v3.5.0 check rules /etc/prometheus/alerts.yml`.

---

## Commit Convention

Commits follow [Conventional Commits](https://www.conventionalcommits.org/). Allowed types (`.commitlintrc.cjs`): `ci`, `chore`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`.

```
feat: add pagination to todo list
fix: return 404 for a todo of another user
docs: update architecture overview
chore: bump prisma
```

`commitlint` enforces this on every commit. The `release` script uses commit history to auto-generate changelogs.

---

## Release

```bash
npm run release
```

Runs `release/before-release.ts` (an interactive checklist), then `release-it` (must run on a clean `main`) with:

- `npm run lint` before the bump
- `npm run build` and `npm run openapi:export` (staging `docs/openapi.json`) after the bump
- Conventional changelog generation (`CHANGELOG.md`, never edited by hand)
- Release commit `chore(release): v<version>`, git tag `v<version>` and push
- GitHub release (no npm publish)

The pushed `v*` tag starts `.github/workflows/cd.yml`, which deploys to AWS (`guide/release-management.md`).

---

## Rules

- For an isolated change, run only the affected spec file (`npx jest <path>`); do not run the full suite for a single file change.
- Never run `npm run release` or push a `v*` tag without an explicit request.
