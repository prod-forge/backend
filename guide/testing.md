# Testing

<p align="center">
  <img alt="Testing" src="assets/testing.jpg" width="733px" height="254px">
</p>

## Unit Tests

According to the testing pyramid, most of the application logic should be covered by unit tests.

The ideal scenario is to test each business logic service independently.

Every service test should include:

- positive cases - expected successful behavior
- negative cases - validation failures and error scenarios

Testing both scenarios ensures that the service behaves correctly under different conditions.

Only public methods should be tested. The internal implementation of a module is not the concern of a test — only the
observable outcome matters.

### Mocking Dependencies

To isolate services during testing, dependencies should be mocked.

Mocks allow tests to simulate interactions with external systems without requiring real infrastructure.

All basic dependency mocks are located in:

```shell
src/mocks/
```

This directory contains simple mock implementations used to emulate common dependencies during unit tests.

## End-to-End Tests (E2E)

End-to-end tests verify the behavior of the application as a complete system.

To emulate external dependencies such as databases and caches, this project uses Testcontainers.

Testcontainers dynamically starts real infrastructure services inside Docker containers during the test run.

In this project they are used to start:

- PostgreSQL
- Redis

This ensures that the application is tested in an environment that closely resembles production.

### Test Environment Setup

The E2E test environment is initialized through several setup files.

```shell
setup.global.ts
```

Responsible for preparing the test environment.

Tasks performed here include:

- starting Testcontainers
- initializing the database
- running migrations
- optionally loading seeds or fixtures

```shell
bootstrap.app.ts
```

Creates one application instance per test file (`beforeAll`) and closes it in `afterAll`. All files share the same
seeded database, so tests must create their own data and avoid depending on rows left by other files.

```shell
teardown.global.ts
```

Responsible for cleaning up after tests.

Tasks include:

- closing open connections
- shutting down Testcontainers
- releasing system resources

### Writing Effective E2E Tests

E2E tests should treat the application as a black box.

Instead of directly calling internal services, tests interact with the application through its public interface - the
HTTP API.

The typical testing workflow looks like this:

1. start the application with test dependencies
2. send HTTP requests to the API
3. verify the responses

In this project, HTTP requests are executed using Supertest.

This approach allows tests to simulate real client interactions with the system while maintaining full control over the
test environment.

## Test Specs Design Style

The following format is recommended for writing test specs:

```markdown
// User Registration

- Negative Cases
  - Should validate email uniqueness
  - Should throw error for invalid data

- Positive Cases
  - Should create a new user with valid data
  - Should hash password before saving
  - Should send welcome email after successful registration
```

The spec is divided into negative and positive cases. Negative cases are listed first, then positive ones.

## What E2E Covers

The e2e suite runs the real application against Testcontainers PostgreSQL and Redis. It covers:

- auth: login stub, token verification, 401 responses
- todos: CRUD, validation errors (422), pagination and search, ownership isolation between users, list and item cache
  invalidation after writes
- cache behaviour: a repeated read of the same todo increments `cache_operations_total{operation="get",result="hit"}`,
  scraped from `/metrics` before and after the second request
- throttling: the global limit answers 429 with `Retry-After`, users are counted separately even behind one IP, `/health`
  and `/metrics` are never throttled (the login limit of 5 per minute has no e2e test)
- metrics gate: `/metrics` and `/metrics/database` (any case, with or without the API prefix) return 404 with
  `X-Forwarded-For` and 200 without it
- health endpoints, version endpoint, client log ingestion, and the OpenAPI contract

It does not cover:

- the observability stack (Prometheus, Grafana, Loki, Tempo); use `scripts/verify-observability.sh`
- performance under load; see Load Testing below
- graceful shutdown with in-flight requests, and real AWS or deployment behaviour
- the browser clients

## Coverage Thresholds

Unit and e2e tests share the same threshold: 80% for branches, functions, lines and statements.

| Suite | Command                | Where                                             |
| ----- | ---------------------- | ------------------------------------------------- |
| Unit  | `npm run test:cov`     | `jest.coverageThreshold` in `package.json`        |
| E2E   | `npm run test:e2e:cov` | `coverageThreshold` in `test/setup/jest-e2e.json` |

Both measure the same files: everything in `src/` except entry points, modules, configuration, DTOs, entities,
interfaces, enums and constants. The entry points are `main.ts` and `instrument.ts`: both run once at process start and
only call helpers that have their own specs (`startTracing`, `buildSentryOptions`, `isSentryEnabled`). The `pre-push` hook and the unit jobs of CI and CD run `npm run test:cov`, so a change that drops
unit coverage below the line is rejected. E2E needs a database and Redis, so it is not part of the hook: CI runs `npm run test:e2e`, and
`npm run test:e2e:cov` checks the e2e threshold.

A threshold is a floor, not a target. It stops a decline; it does not say whether the right things are tested.

## Load Testing

`load/k6-smoke.js` is a smoke load test with [k6](https://k6.io): 10 virtual users for 30 seconds, each iteration runs
list, create, toggle (`PATCH` with `completed`) and delete. Thresholds: `http_req_duration` p(95) < 300ms and
`http_req_failed` rate < 1%.

Login is throttled to 5 requests per minute per IP, so the script logs in the five seeded users once in `setup()` and
the virtual users share those tokens. Run it again no sooner than a minute after the previous run.

The global rate limit (`THROTTLE_LIMIT` per `THROTTLE_TTL` per user or IP: 60 per 60 s in code, 10 per 20 s locally through `.env.common`) would reject most of the load
traffic, so the local run raises it through a compose override that is used for load runs only:

```shell
docker compose -f docker-compose.yml -f load/docker-compose.load.yml up -d --build
# the compose database must be migrated and seeded (see README, Getting started)
BASE_URL=http://localhost:3000 npm run test:load
docker compose down
```

Never use the override outside local load tests. The default configuration is unchanged.

Result of a local run (laptop, everything in Docker on one machine), all thresholds passed:

```text
  █ THRESHOLDS

    http_req_duration
    ✓ 'p(95)<300' p(95)=25.35ms

    http_req_failed
    ✓ 'rate<0.01' rate=0.00%

  █ TOTAL RESULTS

    checks_total.......: 24408   810.4877/s
    checks_succeeded...: 100.00% 24408 out of 24408
    checks_failed......: 0.00%   0 out of 24408

    HTTP
    http_req_duration..............: avg=12.23ms min=1.39ms  med=9.97ms  max=192.78ms p(90)=19.13ms p(95)=25.35ms
    http_req_failed................: 0.00%  0 out of 24413
    http_reqs......................: 24413  810.653729/s

    EXECUTION
    iteration_duration.............: avg=49.2ms  min=21.75ms med=41.33ms max=314.16ms p(90)=74.78ms p(95)=99.12ms
    iterations.....................: 6102   202.621925/s
    vus............................: 10     min=10         max=10
```

This is a smoke check for regressions on a laptop, not a capacity measurement.
