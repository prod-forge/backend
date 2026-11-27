# Changelog

# [1.1.0](https://github.com/prod-forge/backend/compare/v1.0.1...v1.1.0) (2026-11-27)

### Bug Fixes

- **auth:** accept the Bearer scheme case-insensitively ([#54](https://github.com/prod-forge/backend/issues/54)) ([#57](https://github.com/prod-forge/backend/issues/57)) ([2e7f67c](https://github.com/prod-forge/backend/commit/2e7f67cf30ef8649adee66c234354066c822b11b))
- **cache:** count delByPattern in cache_operations_total ([#36](https://github.com/prod-forge/backend/issues/36)) ([#60](https://github.com/prod-forge/backend/issues/60)) ([d3bc4a8](https://github.com/prod-forge/backend/commit/d3bc4a8df7ab15620fc74c6991bfbe940bf7bf7a))
- **client-logs:** log the client trace id for mobile client logs ([#53](https://github.com/prod-forge/backend/issues/53)) ([#56](https://github.com/prod-forge/backend/issues/56)) ([20c9c78](https://github.com/prod-forge/backend/commit/20c9c78517d56d85318d346a082c804d0d385bd3))
- **config:** reject invalid boolean env values instead of reading them as true or false ([#69](https://github.com/prod-forge/backend/issues/69)) ([17c84cb](https://github.com/prod-forge/backend/commit/17c84cb1775de56828b957fb909d8b119aa6ef7a)), closes [#49](https://github.com/prod-forge/backend/issues/49)
- **config:** report failed env variables in the validateConfig error ([1d2b489](https://github.com/prod-forge/backend/commit/1d2b489fa60fba64816145c2391405d3b34e9cb8)), closes [#15](https://github.com/prod-forge/backend/issues/15) [#15](https://github.com/prod-forge/backend/issues/15)
- **config:** report malformed JSON array env variables through validateConfig ([#42](https://github.com/prod-forge/backend/issues/42)) ([4d3c175](https://github.com/prod-forge/backend/commit/4d3c175ebcbc065a3c55c5b5376bb49ffcf6a821))
- **config:** require positive integers for numeric env values ([#50](https://github.com/prod-forge/backend/issues/50)) ([#70](https://github.com/prod-forge/backend/issues/70)) ([cf25e9f](https://github.com/prod-forge/backend/commit/cf25e9fd1efac0e3c6b147072393c14e3089ed6f))
- **database-manager:** url-encode DATABASE_USER and DATABASE_NAME in getDatabaseUrl ([#43](https://github.com/prod-forge/backend/issues/43)) ([3bc9aa8](https://github.com/prod-forge/backend/commit/3bc9aa89cca5c4a01d82a235323524b806a17442)), closes [#38](https://github.com/prod-forge/backend/issues/38)
- **deps:** override effect under @prisma/config to clear the high audit advisory ([#73](https://github.com/prod-forge/backend/issues/73)) ([bc4c498](https://github.com/prod-forge/backend/commit/bc4c4981137541bf8d8a979861fc6a4d63e0b81d))
- **logger:** match LOG_EXCLUDE_ENDPOINTS against the path, not the URL ([#35](https://github.com/prod-forge/backend/issues/35)) ([#59](https://github.com/prod-forge/backend/issues/59)) ([3b22c07](https://github.com/prod-forge/backend/commit/3b22c0706f9ff193deace5d302897e4307acfd4d))
- **prisma:** forward Prisma log events to the logger ([#51](https://github.com/prod-forge/backend/issues/51)) ([#65](https://github.com/prod-forge/backend/issues/65)) ([e55d5ca](https://github.com/prod-forge/backend/commit/e55d5ca61d57b6b386386ed57bec901aa4e4ab1e))
- reject URL-reserved characters in DATABASE_NAME ([#45](https://github.com/prod-forge/backend/issues/45)) ([530d7a1](https://github.com/prod-forge/backend/commit/530d7a150412319286a31614dd3408f1c4c2889c))
- **todos:** add id tiebreaker to the todo list order ([#46](https://github.com/prod-forge/backend/issues/46)) ([2b5719f](https://github.com/prod-forge/backend/commit/2b5719f91908969837e8caf2c8cf3d40974c631e)), closes [#39](https://github.com/prod-forge/backend/issues/39)
- **todos:** keep completed when a PATCH body leaves it out ([#47](https://github.com/prod-forge/backend/issues/47)) ([b0862a3](https://github.com/prod-forge/backend/commit/b0862a3142b6a3fcf717530c1d3fcab1a4e102c3))
- **todos:** reject invalid completed query values ([#41](https://github.com/prod-forge/backend/issues/41)) ([31879d7](https://github.com/prod-forge/backend/commit/31879d74b773c9be278ac82b74baa877d0725dcd)), closes [#33](https://github.com/prod-forge/backend/issues/33)
- **todos:** reject null for title and completed with a 422 ([#68](https://github.com/prod-forge/backend/issues/68)) ([069f787](https://github.com/prod-forge/backend/commit/069f78774d45ede54092727ceb52a3ff30d9ae23)), closes [#48](https://github.com/prod-forge/backend/issues/48)

### Features

- **todos:** return the completed count of the filtered todos in the list meta ([#58](https://github.com/prod-forge/backend/issues/58)) ([832c429](https://github.com/prod-forge/backend/commit/832c429cbc12f42076fe5889bf7b736c9ac99819))

## [1.0.1](https://github.com/prod-forge/backend/compare/v1.0.0...v1.0.1) (2026-11-09)

### Bug Fixes

- accept only short token-like incoming trace ids ([6dac133](https://github.com/prod-forge/backend/commit/6dac1333aff12fb183cd169e5eff77939dda64aa))
- **config:** validate database host before building connection URL ([c5ece6b](https://github.com/prod-forge/backend/commit/c5ece6b56d5184230780fb8aa1cb49cd8c6823e5))
- **database:** check DATABASE_HOST in the seed client and drop untrue host cases ([cd0d513](https://github.com/prod-forge/backend/commit/cd0d513090f48aa0cc1945c04484cfbcfdb2a47c))
- **docker:** drop npm from the production image, migration task calls the prisma cli ([9e3cb4a](https://github.com/prod-forge/backend/commit/9e3cb4a660074465ced049e5b8d1c010068dd41a))
- **e2e:** patch of a missing todo answers TODO_NOT_FOUND since owner scoping ([b7d8618](https://github.com/prod-forge/backend/commit/b7d86180d1bc9cf023feaafbd46feeb0971ab648))
- keep query strings out of Sentry reports ([9216c1c](https://github.com/prod-forge/backend/commit/9216c1c234522f73ac71cf213c35eaa223398056))
- log the real Sentry status and drop a duplicated CORS comment ([2d852b9](https://github.com/prod-forge/backend/commit/2d852b9d3f12cbe3ae52505b626cfb52b0a7390e))
- make the Claude deny hooks actually deny ([c6c8418](https://github.com/prod-forge/backend/commit/c6c84182812d4cc65ee1d406b3ab550c96b7484f))
- make the in-memory throttler fallback follow the Redis script ([32ff448](https://github.com/prod-forge/backend/commit/32ff44832fd37dad92f0e98608e257d2f8200fff))
- remove the unused REDIS_ENABLED variable ([4d95fa9](https://github.com/prod-forge/backend/commit/4d95fa9b3d5d76bd1917d7cfc22af6db2facaa84))
- report an invalid SENTRY_IGNORED_ERRORS with a clear message ([6f55ac9](https://github.com/prod-forge/backend/commit/6f55ac9dd95f191eafa564606969fae4ebed9cf1))
- return remaining seconds from the in-memory throttler fallback ([cc1b911](https://github.com/prod-forge/backend/commit/cc1b911fc751f7dddb53bb78f4c57665cea1d403))

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
