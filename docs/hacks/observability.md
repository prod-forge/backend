# Observability hacks

## instrument.ts is the first import

- **What:** `src/main.ts` starts with `import './instrument';`, before any NestJS import; `instrument.ts` loads `.env` and `.env.common` itself with `dotenv`.
- **Where:** `src/main.ts`, `src/instrument.ts` (comment at the top).
- **Why:** Sentry and OpenTelemetry patch `http`, `express`, `pg` and `ioredis` at require time, so they must run before those modules load; `ConfigModule` is not available yet, so the env files are read with the same precedence by hand.
- **If cleaned up:** moving the import below another import silently drops the auto-instrumentation and Sentry request data.

## Instrumentations disabled in tracing.ts

- **What:** the `router` and `fs` auto-instrumentations are always off; `express`, `http`, `ioredis` and `pg` are off when Sentry is active.
- **Where:** `src/tracing.ts` (`duplicateRoutingInstrumentation`, `sentryInstrumented`, comments in the file).
- **Why:** Express 5 routes through `router`, which the express instrumentation already covers; the router instrumentation adds a `finish` listener per middleware layer and logs `MaxListenersExceededWarning` on every request. Sentry instruments the other four itself, so enabling them twice duplicates spans. The reason for `fs` is not commented (inference: span volume).
- **If cleaned up:** duplicate spans and a warning on every request.

## Metrics hidden behind the ALB by a header

- **What:** `/metrics` and `/metrics/database` return 404 when the request has an `X-Forwarded-For` header.
- **Where:** `src/modules/metrics/middlewares/metrics-gate.middleware.ts` (comment in the file), registered first in `src/app.setup.ts`.
- **Why:** the ALB always appends `X-Forwarded-For`, while Prometheus and the compose stack scrape the task directly without it, so a metrics request with the header came from the internet. The path regex is case-insensitive because Express routing is and the ALB listener rule is not.
- **If cleaned up:** metrics become public through the load balancer.

## Health routes bypass the error envelope

- **What:** `GlobalExceptionFilter` passes the Terminus body and status through for paths that lowercase to `/health` or `/health/...` instead of turning a 503 into `InternalServerError`.
- **Where:** `isHealthPassthrough` in `src/error-handler/mappers/resolve-error.ts`, used by `src/error-handler/filters/global-exception.filter.ts` (see [../architecture/overview.md](../architecture/overview.md), "Error handling").
- **Why:** load balancers and ECS read the readiness status (503 during drain) and the check details.
- **If cleaned up:** readiness turns into a generic 500 and the drain is not visible to the load balancer.
