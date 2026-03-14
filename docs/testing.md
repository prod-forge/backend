# Testing

<p align="center">
  <img alt="Testing" src="https://github.com/prod-forge/backend/blob/main/assets/testing.png" width="733px" height="254px">
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

Creates a fresh application instance for each test scenario.

This ensures that tests remain isolated and do not affect each other.

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
