# Changelog

## 1.0.0 (2026-11-04)

First published version of the Prod Forge backend: a NestJS REST API for todos with the production practices the guide
describes. Earlier tags (`v0.1.0` to `v0.2.0`, March 2026) were local scaffolding iterations that were never pushed;
their content is folded into this release.

### Breaking changes since the 0.2.0 scaffold

- Access tokens are signed HS256 JWTs verified on every protected route; `JWT_SECRET` (32+ characters) is required at
  startup. A login-by-email stub endpoint issues tokens; an identity provider is out of scope.
- Todos are scoped to their owner for read, update and delete; a foreign id answers `404`.
- Todo pagination uses a real 0-based `offset`; page size is capped at 100.
- Title and description have length limits, ids are validated as UUIDs; both are part of the pinned OpenAPI contract.
- Framework `4xx` exceptions keep their status and code; failed health checks return the Terminus `503`.
- `/metrics` is served at the root only and rejected when the request came through the ALB; `/metrics/database`
  returns JSON.
- Cache keys are versioned, old entries are ignored; entries without an owner count as a miss.
- `SENTRY_DSN` is optional, Sentry is enabled only when a DSN is set and `SENTRY_ENABLED` is `true`.

### Features

- Per-user rate limiting behind a trusted proxy; health and metrics endpoints are exempt.
- Graceful shutdown drains readiness first and waits for in-flight requests before the server closes.
- Redis cache with scan-based pattern deletion, hit and miss metrics, optional TLS and AUTH token.
- PostgreSQL through Prisma with pool and statement timeouts and `verify-full` TLS using the RDS CA bundle.
- Liveness and readiness endpoints, version endpoint, client-logs endpoint for the web client.
- The trace id header is exposed to the web client; request logging is GDPR-safe and skips probes.
- OpenAPI contract exported to `docs/openapi.json` and checked in CI.

### Observability

- OpenTelemetry tracing with Tempo, span-aware trace id, W3C `traceparent` accepted alongside Sentry.
- Prometheus metrics recorded once per request, Prisma and slow-query metrics, cache metrics.
- Docker Compose stack with Prometheus, Grafana dashboards, Loki, Promtail and Tempo; alert rules and SLOs that
  exclude probe and scrape routes.
- k6 smoke load test.

### Security

- No secrets in the Docker image, container healthcheck, minimal build context, local compose ports bound to localhost.
- CI runs `npm audit`, CodeQL, Trivy and publishes an SBOM with provenance attestations.

### CI/CD

- CI on pull requests and pushes to `main`: lint, knip, unit and e2e tests with coverage, OpenAPI check.
- CD on `v*` tags: image to ECR, ECS service update, migration task rendered with `jq`; role, cluster and service
  names aligned with terraform outputs; Node.js 24.21.0.
- The `commit-msg` hook rejects AI attribution trailers.

### Documentation

- Backend guide from repository strategy to release management, aligned with the code.
- Agent docs in `.claude/docs`, cspell dictionary, roadmap, contributing guide, MIT license.
