# Architecture

## Overview

`prod-forge-todolist-backend` is a production-grade NestJS REST API demonstrating real-world backend patterns:
layered architecture, caching, structured logging, observability, error handling, and graceful shutdown.

**Stack:** Node.js 24 · NestJS 11 · TypeScript 6 · PostgreSQL 18 · Redis 8 · Prisma 7 · prom-client · pino · Sentry

---

## Layer Diagram

```
HTTP Request
     │
     ▼
[Middlewares]
  metricsGate → httpContext → traceId → sentryContext (if Sentry on)
  → body parsers + request logging → helmet (production) → compression → CORS
  → requestTracking (module middleware)
     │
     ▼
[Guards]
  UserThrottlerGuard (global) → AuthGuard (per-route)
     │
     ▼
[Pipes]
  ValidationPipe (global, class-validator + class-transformer)
     │
     ▼
[Controller]  src/api/<feature>/
  Transport only: routing, guards, response mapping
     │
     ▼
[Service]     src/features/<feature>/
  Business logic, cache read/write/invalidation
     │
     ▼
[Repository]  src/features/<feature>/
  Prisma queries, entity mapping
     │
     ▼
[Database]    PostgreSQL via PrismaService
     │
     ▼
[Response]
  ClassSerializerInterceptor
  → UnifiedResponseInterceptor   { data, meta? }
  → HttpMetricsInterceptor       (Prometheus counters)
```

---

## Directory Structure

```
src/
  api/               Controllers + DTOs (transport layer only)
    auth/
    todos/
    client-logs/
    health/
    metrics/
    version/
  features/          Business logic layer
    todos/           Service, repository, entity, mapper, cache-queries, constants, interfaces, types
    client-logs/     Service only (fire-and-forget log ingestion)
    users/           Repository + service (email lookup, token issue for login)
  modules/           Infrastructure modules
    prisma/          PrismaService + connection management
    redis-manager/   Two Redis clients (cache, throttler) + health
    health/          Health checks (DB + Redis + shutdown state)
    metrics/         Prometheus metrics (HTTP + database)
    environment/     NODE_ENV helpers (isProduction, isTest, etc.)
    sentry/          Sentry status log + request context middleware (SDK init lives in src/instrument.ts)
    shutdown/        Graceful shutdown with in-flight tracking
    in-flight-requests/ Middleware that tracks active requests
    auth/            AuthService: JWT issue and verify (HS256)
    version/         Reads app version (APP_VERSION, defaults to package.json)
  common/            Reusable cross-cutting code
    decorators/      @User, @Public, custom Swagger decorators
    guards/          AuthGuard, UserThrottlerGuard
    interceptors/    UnifiedResponseInterceptor
    utils/           validate-config, objects, strings
  config/            NestJS config factories (one per concern)
  error-handler/     Centralized error system
    errors/          Domain error classes extending BaseError
    filters/         GlobalExceptionFilter
    mappers/         Prisma error mapper, frontend mapper
    parsers/         Validation error parser
    constants/       ErrorCodes, ErrorCategory enums
  logger/            pino-based structured logger
    middlewares/     logging.middleware, request-logging.setup, trace-id.middleware
    context/         AsyncLocalStorage request context
    headers/         Trace-ID header constant
  shared/            DTOs and entities reused across features
  constants/         Shared URL constants
  mocks/             Shared jest mocks (prisma, cache)
  main.ts            Bootstrap
  app.module.ts      Root module
  app.setup.ts       Middleware, pipes, interceptors, filters wiring
  app.swagger.ts     Swagger / Scalar setup
```

---

## Key Modules

### PrismaModule

Wraps `PrismaService` which extends the generated Prisma client. Connects on `onModuleInit`, disconnects on shutdown. Exported from `PrismaModule`, which is not global: modules that need `PrismaService` import `PrismaModule`.

### RedisManagerModule

Creates two separate Redis connections:

- **CacheClient** — used by `CacheStorage` for application-level caching
- **ThrottlerClient** — used by `ThrottlerStorage` for rate-limiting state

Both clients inherit from `BaseRedisService` (reconnect delay grows by 200 ms per attempt up to 5 s, no offline queue, 1 s connect timeout). In test environments, retries are disabled.

### Health

Three endpoints, all excluded from the global prefix and from throttling:

- `GET /health/live` — liveness, no checks (Docker `HEALTHCHECK`, ECS container `healthCheck`)
- `GET /health` — critical checks: DB ping + shutdown state
- `GET /health/deps` — all checks: DB + Redis

### Metrics

Prometheus metrics exposed at `/metrics` (default prom-client metrics + custom counters):

- `http_requests_total` — labeled by method, route, status
- `http_errors_total` — labeled by method, route, status (route is `unmatched` when no route matched)
- `http_request_duration_seconds` — histogram
- `http_requests_in_flight` — gauge
- `prisma_query_duration_seconds`, `prisma_queries_total`, `prisma_queries_per_request` — fed by Prisma query events (`PrismaService`) and the per-request counter in `RequestContext`
- `db_slow_query_mean_ms{queryid}` — gauge refreshed on each scrape from `pg_stat_statements` (top 10)
- `service_health_status{service}` — gauge from the critical health checks
- `cache_operations_total{operation, result}` — cache `get`/`set`/`del` outcomes (`ok`, `hit`, `miss`, `error`)
- `HealthUpdateMiddleware` refreshes dependency health on `/metrics` at most once per `HEALTH_CHECK_TRIGGER_MS`
- `/metrics` and `/metrics/database` sit outside the API prefix (`GLOBAL_PREFIX_EXCLUDE` in `src/constants/url.constants.ts`); `metricsGateMiddleware` returns 404 for them when `X-Forwarded-For` is present (request came through the ALB)

### Shutdown

`ShutdownModule` listens for `SIGTERM`/`SIGINT`. `RequestTrackingService` counts in-flight requests; it is a singleton provided by `RequestTrackingModule` (imported by `AppModule` for the middleware and by `ShutdownModule`), never redeclared elsewhere. On signal, the app enters a draining state: `/health` returns 503 and new requests continue to be served for `SHUTDOWN_DRAIN_MS` (10 s). Then the process waits up to `SHUTDOWN_INFLIGHT_TIMEOUT_MS` (20 s) for the in-flight count to reach zero, and finally disconnects Prisma, Redis and tracing.

### Error handling

`GlobalExceptionFilter` (`@Catch()`) handles all unhandled exceptions:

1. **Domain error** (`BaseError` subclass) — pass through with its HTTP status and code
2. **Prisma error** — mapped via `mapPrismaError` to `DATABASE_ERROR` (400/404/409) or `DTO_VALIDATION_ERROR` (malformed value); unmapped Prisma errors become `INTERNAL_ERROR`
3. **NestJS `HttpException`** — 4xx keeps its status with a generic code and message (`NOT_FOUND`, `TOO_MANY_REQUESTS`, ...); 5xx becomes `InternalServerError` (details hidden), except on health routes (`isHealthPassthrough`: lowercased `req.path` is `/health` or `/health/...`), where the Terminus body and status (503 during drain) are passed through and the HTTP metrics label the same status
4. **Unknown** — `InternalServerError`

Every error is logged via `LoggerService`, counted in `http_errors_total` (status 400 and above), and sent to Sentry from the filter only when it is an incident (5xx or unknown error). Sentry is initialized in `src/instrument.ts`, the first import of `main.ts`.

### Authentication

`AuthGuard` is applied per-route with `@UseGuards(AuthGuard)`. Routes decorated with `@Public()` bypass it. The guard reads the `Authorization: Bearer <token>` header and verifies the HS256 signature and expiry through `AuthService.verifyToken` (`AuthModule`, signed with `JWT_SECRET`), then sets `req.userId` from the `sub` claim. `POST /api/v1/auth/login` (`AuthController`, backed by `UsersModule`) is a public login stub that issues tokens for registered emails.

### Response envelope

`UnifiedResponseInterceptor` wraps all responses except `/metrics`, `/metrics/database`, `/health`, `/health/live` and `/health/deps` (`GET /api/version` is wrapped):

- Empty result → `204 No Content`
- Result with `meta` → `{ data: ..., meta: ... }`
- Plain result → `{ data: ... }`

---

## Request Lifecycle (example: `GET /api/v1/todos`)

1. `traceIdMiddleware` — resolves the trace ID (active span, incoming `X-Trace-Id`, else a new UUID), sets the `X-Trace-Id` response header and the `AsyncLocalStorage` context
2. `loggingMiddleware` — logs incoming request with trace ID
3. `UserThrottlerGuard` — checks the rate-limit bucket in Redis (per user, else per IP)
4. `AuthGuard` — verifies the signed Bearer JWT, sets `req.userId`
5. `ValidationPipe` — transforms and validates query params
6. `TodosController.findAll` — delegates to `TodosService`
7. `TodosService.findAll` — checks Redis cache; on miss queries DB, stores result
8. `TodosRepository.findAll` — runs `$transaction([findMany, count])`
9. `plainToInstance(TodosResponseDto, ...)` — shapes controller response
10. `ClassSerializerInterceptor` — applies `@Expose()` rules
11. `UnifiedResponseInterceptor` — wraps to `{ data, meta }`
12. `HttpMetricsInterceptor` — increments Prometheus counters

---

## Observability Stack (docker-compose)

| Service    | Port | Purpose                          |
| ---------- | ---- | -------------------------------- |
| Prometheus | 9090 | Scrapes `/metrics`               |
| Grafana    | 3001 | Dashboards (admin/admin)         |
| Loki       | 3100 | Log aggregation                  |
| Promtail   | 9080 | Reads Docker logs, ships to Loki |
| Tempo      | 3200 | Trace storage (OTLP on 4318)     |

All services share one `backend` network. Configs live in `observability/` (`prometheus/prometheus.yml` + `alerts.yml`,
`grafana/datasources.yml` + `dashboards.yml`, `loki/`, `promtail/`, `tempo/`, `dashboards/*.json`); image tags are
pinned to the terraform monitoring host versions. `scripts/verify-observability.sh` checks the stack end to end.

Tracing: `src/tracing.ts` (`startTracing`, called from `src/instrument.ts`) starts the OpenTelemetry `NodeSDK` only when
`OTEL_EXPORTER_OTLP_ENDPOINT` is set; with Sentry active it owns the single TracerProvider and Sentry is initialised with
`skipOpenTelemetrySetup`. `shutdownTracing()` flushes spans from `ShutdownService.onApplicationShutdown`.
`traceIdMiddleware` prefers the active span's trace id.

---

## Environment Modes

| `NODE_ENV`    | Behavior                                                          |
| ------------- | ----------------------------------------------------------------- |
| `development` | Swagger available (`SWAGGER_ENABLED`), pino-pretty (`LOG_PRETTY`) |
| `production`  | Swagger disabled, Helmet with HSTS enabled                        |
| `test`        | Redis retry disabled, throttle limits relaxed via `.env.test`     |

CORS is on in every mode: only origins in `API_ALLOWED_ORIGINS` are accepted, plus requests without an `Origin` header when `API_ALLOWED_NON_BROWSER_ORIGINS=true`. `X-Trace-Id` is exposed to browsers.

---

## Logging

The app uses structured JSON logging via pino. In development, `LOG_PRETTY=true` enables human-readable output.

Every log entry includes:

- `timestamp` — ISO 8601
- `level` — trace/debug/info/warn/error
- `traceId` — from the request context (active trace id, else the incoming `X-Trace-Id`, else a UUID)
- `ctx` — the class name that produced the log
- `msg` — log message
- `appName`, `env`, `pid` — process metadata

Sensitive fields automatically redacted (`src/logger/log-redact.ts`): `req.headers.authorization`, `req.headers.cookie`, `req.body.password`, `req.body.email`, `req.body.token`, top-level `password` and `token`.

---

## Docker Image

The `Dockerfile` uses a two-stage build:

1. **builder** — installs all deps, generates Prisma client, compiles TypeScript
2. **production** — copies only compiled output and prod deps, adds the AWS RDS CA bundle (`NODE_EXTRA_CA_CERTS`, so `pg` can verify RDS certificates), removes the bundled npm (nothing runs through it: the app starts with `node`, the ECS migration task runs `node_modules/.bin/prisma migrate deploy`), runs as unprivileged `nodeuser`

How to build and run it locally is in [../commands.md](../commands.md#docker).
