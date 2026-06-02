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
  traceId → logging → sentryContext → requestTracking
     │
     ▼
[Guards]
  ThrottlerGuard (global) → AuthGuard (per-route)
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
  → SentryInterceptor            (exception capture)
```

---

## Directory Structure

```
src/
  api/               Controllers + DTOs (transport layer only)
    todos/
    client-logs/
    health/
    metrics/
    version/
  features/          Business logic layer
    todos/           Service, repository, entity, mapper, cache-queries, types
    client-logs/     Service only (fire-and-forget log ingestion)
  modules/           Infrastructure modules
    prisma/          PrismaService + connection management
    redis-manager/   Two Redis clients (cache, throttler) + health
    health/          Health checks (DB + Redis + shutdown state)
    metrics/         Prometheus metrics (HTTP + database)
    environment/     NODE_ENV helpers (isProduction, isTest, etc.)
    sentry/          Sentry SDK wiring
    shutdown/        Graceful shutdown with in-flight tracking
    in-flight-requests/ Middleware that tracks active requests
    version/         Reads app version from package.json
  common/            Reusable cross-cutting code
    decorators/      @User, @Public, custom Swagger decorators
    guards/          AuthGuard
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
    middlewares/     logging.middleware, trace-id.middleware
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

Wraps `PrismaService` which extends the generated Prisma client. Connects on `onModuleInit`, disconnects on shutdown. Exported globally from `PrismaModule`.

### RedisManagerModule

Creates two separate Redis connections:

- **CacheClient** — used by `CacheStorage` for application-level caching
- **ThrottlerClient** — used by `ThrottlerStorage` for rate-limiting state

Both clients inherit from `BaseRedisService` (exponential retry, no offline queue, 1 s connect timeout). In test environments, retries are disabled.

### Health

Two endpoints, both excluded from the global prefix:

- `GET /health` — critical checks: DB ping + shutdown state
- `GET /health/deps` — all checks: DB + Redis

### Metrics

Prometheus metrics exposed at `/metrics` (default prom-client metrics + custom counters):

- `http_requests_total` — labeled by method, route, status
- `http_errors_total` — labeled by method, route, status
- `http_request_duration_seconds` — histogram
- Database-level metrics pulled on each `/metrics` scrape via `HealthUpdateMiddleware`

### Shutdown

`ShutdownModule` listens for `SIGTERM`/`SIGINT`. `RequestTrackingService` counts in-flight requests. On signal, the app enters a draining state: health/ready returns unhealthy, new requests continue but the process waits for in-flight count to drop to zero before exiting.

### Error handling

`GlobalExceptionFilter` (`@Catch()`) handles all unhandled exceptions:

1. **Domain error** (`BaseError` subclass) — pass through with its HTTP status and code
2. **Prisma error** — mapped to a structured `DatabaseError` via `mapPrismaError`
3. **NestJS `HttpException`** — returned as generic `InternalServerError` (details hidden)
4. **Unknown** — `InternalServerError`

Every error is logged via `LoggerService`, counted in Prometheus, and optionally sent to Sentry.

### Authentication

`AuthGuard` is applied per-route with `@UseGuards(AuthGuard)`. Routes decorated with `@Public()` bypass it. The guard reads the `Authorization: Bearer <token>` header and Base64-decodes the token as the `userId`. This is a simplified placeholder — no JWT verification is performed.

### Response envelope

`UnifiedResponseInterceptor` wraps all responses (except `/metrics` and `/health` endpoints):

- Empty result → `204 No Content`
- Result with `meta` → `{ data: ..., meta: ... }`
- Plain result → `{ data: ... }`

---

## Request Lifecycle (example: `GET /api/v1/todos`)

1. `traceIdMiddleware` — attaches UUID trace ID to request and `AsyncLocalStorage` context
2. `loggingMiddleware` — logs incoming request with trace ID
3. `ThrottlerGuard` — checks rate-limit bucket in Redis
4. `AuthGuard` — decodes Bearer token, sets `req.userId`
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

---

## Environment Modes

| `NODE_ENV`    | Behavior                                                      |
| ------------- | ------------------------------------------------------------- |
| `development` | CORS enabled, Swagger available, pino-pretty output           |
| `production`  | Swagger disabled, Helmet HSTS enforced, no CORS wildcard      |
| `test`        | Redis retry disabled, throttle limits relaxed via `.env.test` |
