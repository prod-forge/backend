# Observability hacks

## instrument.ts is the first import

- **What:** `src/main.ts` starts with `import './instrument';`, before any NestJS import; `instrument.ts` loads `.env` and `.env.common` itself with `dotenv`.
- **Where:** `src/main.ts`, `src/instrument.ts` (comment at the top).
- **Why:** Sentry and OpenTelemetry patch `http`, `express`, `pg` and `ioredis` at require time, so they must run before those modules load; `ConfigModule` is not available yet, so the env files are read with the same precedence by hand.
- **If cleaned up:** moving the import below another import silently drops the auto-instrumentation and Sentry request data.

## Instrumentations disabled in tracing.ts

- **What:** the `router` and `fs` auto-instrumentations are off; every other auto-instrumentation (`http`, `express`, `pg`, `ioredis`, ...) stays on, with or without Sentry.
- **Where:** `src/tracing.ts` (`duplicateRoutingInstrumentation`, the `getNodeAutoInstrumentations` call in `startTracing`, comments in the file).
- **Why:** Express 5 routes through `router`, which the express instrumentation already covers; the router instrumentation adds a `finish` listener per middleware layer and logs `MaxListenersExceededWarning` on every request. Nothing else is duplicated: with an OTLP endpoint the `NodeSDK` owns tracing, and Sentry 11 is initialised without `tracesSampleRate` and with `enableOpenTelemetrySetup: false`, so it records no spans of its own and only receives the OTel spans over OTLP (`src/modules/sentry/sentry-options.ts`, "Two tracing modes for Sentry 11" in [dependencies.md](dependencies.md)). The reason for `fs` is not commented (inference: span volume).
- **If cleaned up:** a warning on every request (router), and many short spans (fs).

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
