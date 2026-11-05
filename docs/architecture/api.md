# API Reference

## Base URL

```
http://localhost:3000/api/v1
```

All routes are prefixed with `/api` (configurable via `API_PREFIX`) and versioned with `/v1` in the URI.

**Exceptions** — these routes bypass the global prefix entirely:

- `GET /health`
- `GET /health/live`
- `GET /health/deps`
- `GET /metrics`
- `GET /metrics/database`

`GET /api/version` is the only unversioned route under the prefix (no `/v1`).

---

## Authentication

Protected routes require a signed JWT access token (HS256, `sub` = user id):

```
Authorization: Bearer <access-token>
```

Obtain a token with `POST /api/v1/auth/login` (public, throttled to 5 requests per minute):

```
POST /api/v1/auth/login
{ "email": "user1@example.com" }
-> 200 { "data": { "accessToken": "<jwt>", "expiresIn": 3600 } }
```

`email` must be a valid address of at most 254 chars (otherwise `DTO_VALIDATION_ERROR` 422). An unknown email returns 401 `USER_IS_NOT_AUTHORIZED`. The endpoint is a development stub and checks no password. `AuthGuard` verifies the signature and expiry through `AuthService.verifyToken` and sets `req.userId` from `sub`; a missing header, a non-Bearer prefix, a bad signature or an expired token all return 401 `USER_IS_NOT_AUTHORIZED`. Tokens are signed with `JWT_SECRET` and live for `JWT_TTL` seconds. For a token without calling the API run `npm run token:issue -- <userId>`.

Routes marked `@Public()` (login, client logs, health, metrics, version) do not require this header. Unprotected routes never inspect it.

---

## Response Envelope

All non-excluded responses are wrapped:

```json
{ "data": <payload> }
```

Paginated responses include metadata:

```json
{
  "data": [...],
  "meta": {
    "limit": 10,
    "offset": 0,
    "total": 42
  }
}
```

Empty results return `204 No Content` with no body.

Excluded from the envelope: `/metrics`, `/metrics/database`, `/health`, `/health/live`, `/health/deps`.

### Trace id

Every response carries an `X-Trace-Id` header (the active OpenTelemetry trace id, else an incoming `X-Trace-Id`, else a new UUID). CORS exposes it to browser scripts (`exposedHeaders: ['X-Trace-Id']`), so clients can read it from error responses to correlate with server logs.

---

## Error Response Shape

```json
{
  "code": "TODO_NOT_FOUND",
  "message": "Todo not found",
  "status": 404,
  "details": { "id": "abc-123" }
}
```

| Field     | Description                                    |
| --------- | ---------------------------------------------- |
| `code`    | Machine-readable `ErrorCodes` enum value       |
| `message` | Human-readable description                     |
| `status`  | HTTP status code (mirrors response status)     |
| `details` | Optional structured context (varies per error) |

The trace id is not part of the body; read it from the `X-Trace-Id` header. For `DTO_VALIDATION_ERROR`, `details` maps a field name to its messages (validation stops at the first failure per field). Health routes are the exception: a failing check returns the Terminus body with status 503 instead of this shape.

### Error Codes

| Code                     | HTTP          | Description                                                                |
| ------------------------ | ------------- | -------------------------------------------------------------------------- |
| `TODO_NOT_FOUND`         | 404           | Todo does not exist or belongs to another user                             |
| `USER_IS_NOT_AUTHORIZED` | 401           | Missing or invalid Bearer token; unknown email on login                    |
| `DTO_VALIDATION_ERROR`   | 422           | Body, query or path validation failed (also a malformed value in Prisma)   |
| `DATABASE_ERROR`         | 400, 404, 409 | Mapped Prisma error: 400 invalid value, 404 record not found, 409 conflict |
| `INTERNAL_ERROR`         | 500           | Unclassified server error, including unmapped Prisma errors                |
| `BAD_REQUEST`            | 400           | Malformed request (e.g. bad JSON)                                          |
| `NOT_FOUND`              | 404           | Unknown route                                                              |
| `PAYLOAD_TOO_LARGE`      | 413           | Request body too large                                                     |
| `TOO_MANY_REQUESTS`      | 429           | Throttled (keeps `Retry-After`)                                            |
| `HTTP_EXCEPTION`         | other 4xx     | Any other framework 4xx `HttpException`                                    |

Defined in `ErrorCodes` but not returned by any route today: `USER_NOT_FOUND`, `FORBIDDEN`, `REDIS_ERROR` (only logged when Redis fails to close on shutdown) and `INFRA_FAILURE` (internal `safeExec` errors). A framework 5xx `HttpException` is hidden behind `INTERNAL_ERROR`.

---

## Rate Limiting

Global `UserThrottlerGuard` applied to all routes except the health, metrics and version routes (`@SkipThrottle()`). The bucket key is the user id from a valid Bearer token, else the client IP (`req.ip`, see `TRUST_PROXY`). State lives in Redis. Rate limiting is off when `THROTTLE_ENABLED=false`.

Code defaults: `THROTTLE_LIMIT=60` requests per `THROTTLE_TTL=60000` ms. `.env.common` overrides them locally with `10` per `20000` ms. Per-route overrides: login 5 per minute, client logs 20 per minute. A throttled request returns 429 `TOO_MANY_REQUESTS`.

---

## Endpoints

---

### Todos

> Base path: `/api/v1/todos` · Auth required on all routes

---

#### `POST /api/v1/todos` — Create Todo

**Request body**

```json
{
  "title": "Buy milk",
  "description": "Oat milk please",
  "completed": false
}
```

| Field         | Type      | Required | Default | Description                    |
| ------------- | --------- | -------- | ------- | ------------------------------ |
| `title`       | `string`  | yes      | —       | Todo title (≤ 200 chars)       |
| `description` | `string`  | no       | —       | Optional detail (≤ 2000 chars) |
| `completed`   | `boolean` | no       | `false` | Completion status              |

**Response `200`**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy milk",
    "description": "Oat milk please",
    "completed": false
  }
}
```

Unknown properties are rejected with `DTO_VALIDATION_ERROR` 422 (`whitelist` + `forbidNonWhitelisted`). The status is `200`, not `201`.

**Errors:** `DTO_VALIDATION_ERROR` 422 · `USER_IS_NOT_AUTHORIZED` 401 · `INTERNAL_ERROR` 500

**Side effects:** Invalidates Redis cache key pattern `v2:todos:<userId>:*`

---

#### `GET /api/v1/todos` — List Todos (paginated)

**Query parameters**

| Param         | Type                                  | Required | Default     | Description                       |
| ------------- | ------------------------------------- | -------- | ----------- | --------------------------------- |
| `limit`       | `integer` (1-100)                     | no       | `10`        | Items per page                    |
| `offset`      | `integer` (≥ 0)                       | no       | `0`         | Number of rows to skip (0-based)  |
| `completed`   | `boolean` (`true`/`false`)            | no       | —           | Filter by completion status       |
| `search`      | `string` (≤ 100 chars)                | no       | —           | Case-insensitive substring search |
| `searchField` | `title` \| `description`              | no       | `title`     | Field to search in                |
| `sortBy`      | `title` \| `completed` \| `createdAt` | no       | `createdAt` | Sort field                        |
| `order`       | `asc` \| `desc`                       | no       | `desc`      | Sort direction                    |

**Response `200`**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Buy milk",
      "description": null,
      "completed": false
    }
  ],
  "meta": {
    "limit": 10,
    "offset": 0,
    "total": 1
  }
}
```

**Errors:** `DTO_VALIDATION_ERROR` 422 · `USER_IS_NOT_AUTHORIZED` 401 · `INTERNAL_ERROR` 500

**Caching:** Results cached in Redis for 30 s. Cache key is `v2:todos:<userId>:<base64(query)>`.

---

#### `GET /api/v1/todos/:id` — Get Todo

**Path params**

| Param | Type     | Description                                                    |
| ----- | -------- | -------------------------------------------------------------- |
| `id`  | `string` | Todo UUID (malformed value returns `DTO_VALIDATION_ERROR` 422) |

**Response `200`**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy milk",
    "description": null,
    "completed": false
  }
}
```

**Errors:** `DTO_VALIDATION_ERROR` 422 · `TODO_NOT_FOUND` 404 · `USER_IS_NOT_AUTHORIZED` 401 · `INTERNAL_ERROR` 500

**Ownership:** A todo owned by another user returns `TODO_NOT_FOUND` 404 (same as a missing todo).

**Caching:** Result cached in Redis for 60 s under key `v2:todo:<id>`. The cached entry stores `userId`, which is checked against the caller on every hit; an entry without `userId` (written by an older version) is a miss.

---

#### `PATCH /api/v1/todos/:id` — Update Todo

**Path params**

| Param | Type     | Description                                                    |
| ----- | -------- | -------------------------------------------------------------- |
| `id`  | `string` | Todo UUID (malformed value returns `DTO_VALIDATION_ERROR` 422) |

**Request body** (all fields optional)

```json
{
  "title": "Buy oat milk",
  "description": "From the big supermarket",
  "completed": true
}
```

| Field         | Type      | Required | Description                    |
| ------------- | --------- | -------- | ------------------------------ |
| `title`       | `string`  | no       | Todo title (≤ 200 chars)       |
| `description` | `string`  | no       | Optional detail (≤ 2000 chars) |
| `completed`   | `boolean` | no       | Completion status              |

**Response `200`**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy oat milk",
    "description": "From the big supermarket",
    "completed": true
  }
}
```

**Errors:** `DTO_VALIDATION_ERROR` 422 · `TODO_NOT_FOUND` 404 · `USER_IS_NOT_AUTHORIZED` 401 · `INTERNAL_ERROR` 500

**Ownership:** A todo owned by another user returns `TODO_NOT_FOUND` 404; nothing is written.

**Side effects:** Deletes cache key `v2:todo:<id>` and pattern `v2:todos:<userId>:*`

---

#### `DELETE /api/v1/todos/:id` — Delete Todo

**Path params**

| Param | Type     | Description                                                    |
| ----- | -------- | -------------------------------------------------------------- |
| `id`  | `string` | Todo UUID (malformed value returns `DTO_VALIDATION_ERROR` 422) |

**Response `204 No Content`**

**Errors:** `DTO_VALIDATION_ERROR` 422 · `TODO_NOT_FOUND` 404 · `USER_IS_NOT_AUTHORIZED` 401 · `INTERNAL_ERROR` 500

**Ownership:** A todo owned by another user returns `TODO_NOT_FOUND` 404; nothing is written.

**Side effects:** Deletes cache key `v2:todo:<id>` and pattern `v2:todos:<userId>:*`

---

### Client Logs

> Base path: `/api/v1/client-logs` · No auth required (`@Public()`) · Throttled to 20 requests per minute · Fire-and-forget (always `204`)
>
> Entries are logged at `warn` with `ctx: 'client-logs'`. Free-text fields have `MaxLength` limits (action `message` 2000, optional `stack` 10000, `ctx`/`env`/`platform` 50-100, `actions` at most 100 items); longer values fail validation. `url` and `fullUrl` are logged without query string and hash.

---

#### `POST /api/v1/client-logs/web` — Ingest Web Logs

**Request body**

```json
{
  "traceId": "9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae",
  "timestamp": "2026-05-18T08:16:13.163Z",
  "env": "production",
  "metadata": {
    "browser": "Chrome",
    "browserVersion": "148.0.0.0",
    "os": "macOS 10.15.7",
    "screen": "1728x1117",
    "viewport": "1046x920",
    "devicePixelRatio": 2,
    "language": "en-US",
    "timezone": "Europe/London",
    "mobile": false,
    "url": "/todo/abc",
    "fullUrl": "http://localhost:5173/todo/abc"
  },
  "actions": [
    {
      "level": "info",
      "ctx": "TodoPage",
      "message": "Fetching todo",
      "payload": { "id": "abc-123" }
    }
  ]
}
```

**Response `204 No Content`**

**Errors:** `DTO_VALIDATION_ERROR` 422 · `INTERNAL_ERROR` 500

---

#### `POST /api/v1/client-logs/mobile` — Ingest Mobile Logs

**Request body**

```json
{
  "traceId": "9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae",
  "timestamp": "2026-05-18T08:16:13.163Z",
  "platform": "ios",
  "payload": { "screen": "TodoList", "event": "load" }
}
```

**Response `204 No Content`**

**Errors:** `DTO_VALIDATION_ERROR` 422 · `INTERNAL_ERROR` 500

---

### Health

> No global prefix · No auth · No response envelope · Not throttled

---

#### `GET /health` — Readiness Check

Checks: PostgreSQL ping + shutdown drain state.

**Response `200`**

```json
{
  "status": "ok",
  "info": { "database": { "status": "up" }, "shutdown": { "status": "up" } },
  "error": {},
  "details": { "database": { "status": "up" }, "shutdown": { "status": "up" } }
}
```

Returns `503` when any check fails (used by the ALB target group health check). During shutdown the `shutdown` check reports down from the moment shutdown starts, and the server stays up for `SHUTDOWN_DRAIN_MS` so the ALB stops routing before it closes.

---

#### `GET /health/live` — Liveness

No dependency checks. **Response `200`** — `{ "status": "ok" }`. Used by the Docker `HEALTHCHECK` and the ECS container `healthCheck` so a database outage never restarts healthy tasks; the ALB target group uses `/health`.

---

#### `GET /health/deps` — Dependency Health

Checks: PostgreSQL ping + Redis ping.

**Response `200`** — same shape as `/health`; `503` with the same body when a check is down (monitoring only, not used for routing)

---

### Metrics

> No global prefix · No auth · No response envelope · Internal only: `metricsGateMiddleware` (first middleware in `appSetup`) returns `404` for `/metrics*` and `/api/metrics*` (case-insensitive) when `X-Forwarded-For` is present, i.e. the request came through the ALB

---

#### `GET /metrics` — Prometheus Metrics

Returns default `@prometheus-io/client` metrics plus:

- `http_requests_total{method, route, status}`
- `http_errors_total{method, route, status}` (`route` is the route template, or `unmatched` when no route matched)
- `http_request_duration_seconds{method, route, status}` (histogram)
- `http_requests_in_flight` (gauge)
- `prisma_query_duration_seconds` (histogram), `prisma_queries_total`, `prisma_queries_per_request` (histogram)
- `service_health_status{service}` (gauge, 1 up / 0 down, refreshed at most every `HEALTH_CHECK_TRIGGER_MS`)
- `cache_operations_total{operation, result}`
- `db_slow_query_mean_ms{queryid}` (gauge, top 10, refreshed on scrape)

`route` is the route template, never the raw URL.

Content-Type: `text/plain; version=0.0.4` (the `@prometheus-io/client` default; not wrapped in the envelope).

---

#### `GET /metrics/database` — Database Metrics

Returns the 10 slowest statements from `pg_stat_statements` as JSON for humans (empty array when the extension is not installed).

Response: `[{ queryId, query, calls, meanMs, maxMs, totalMs }]`. Prometheus reads the same data from `db_slow_query_mean_ms{queryid}` on `/metrics`.

---

### Version

#### `GET /api/version` — App Version

> Under the global prefix, unversioned, no auth, not throttled. Wrapped in the response envelope.

**Response `200`**

```json
{ "data": { "version": "1.0.0" } }
```

The value is `APP_VERSION`, which defaults to the `version` in `package.json`.

---

## Swagger UI

Available when `NODE_ENV` is not `production` and `SWAGGER_ENABLED=true`, at the path configured by `SWAGGER_ENDPOINT` (code default `docs`; `.env.common` sets `/docs`).
Powered by Scalar (`@scalar/nestjs-api-reference`). Includes Bearer auth input for testing protected routes.

The contract is committed as `docs/openapi.json`. After any change to routes, DTOs or Swagger decorators run
`npm run openapi:export` and commit the result; `npm run openapi:check` and `test/openapi.e2e-spec.ts` fail on drift.
