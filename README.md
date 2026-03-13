<p align="center">
  <img alt="Logo" src="https://github.com/prod-forge/backend/blob/main/assets/prod-forge-logo.png" width="264px" height="243px">
</p>

**Prod Forge** is an open-source guide to building production-ready software systems.

The goal of this project is not to create another boilerplate or demo application.

Instead, it focuses on **everything that happens around the code** when building real products:

- architecture decisions
- team workflows
- infrastructure setup
- observability
- release engineering
- production safety

Most tutorials focus on writing the application itself.

This project focuses on **what happens before and after the code is written.**

## The idea

To demonstrate these practices, we build a **simple Todo List application**.

The application itself is intentionally simple.

However, we treat it **as if it were a real production system**, implementing modern engineering practices used in
real-world projects.

This includes:

- production-ready backend architecture
- infrastructure as code
- observability
- CI/CD pipelines
- release management
- monitoring and alerting
- rollback strategies
- security practices

The goal is to show **how to move from a simple idea to a production-ready system.**

## Project structure

This project is split into multiple repositories:

| Repository     | Description                          |
| -------------- | ------------------------------------ |
| Backend        | Production-ready backend application |
| Infrastructure | Terraform infrastructure for AWS     |

- [Backend](https://github.com/prod-forge/backend)
- [Infrastructure](https://github.com/prod-forge/terraform)

## Overview

<p align="center">
  <img alt="Architecture" src="https://github.com/prod-forge/backend/blob/main/assets/architecture_diagram.png">
</p>

This repository demonstrates how to build a **production-ready backend system** using modern engineering practices.

The application itself is intentionally simple — a Todo List API.

However, the focus of this project is **not the application logic**.

The focus is on everything required to run a backend system in production.

## Stack

The backend uses a modern and commonly used production stack:

- NestJS
- Prisma
- PostgreSQL
- Redis
- Docker

Observability stack:

- Prometheus
- Grafana
- Loki

Quality and workflow:

- ESLint
- Prettier
- Husky
- Commitlint
- CI/CD pipelines

# 1. The Beginning

## Repository Strategy

<p align="center">
  <img alt="Repository Strategy" src="https://github.com/prod-forge/backend/blob/main/assets/repo-strategy.png" width="512px" height="768px">
</p>

One of the first architectural decisions when starting a project is choosing the repository structure.

In practice, there are two common approaches:

- **Monorepo** – all services and applications live in a single repository
- **Single repository per service** – each service is maintained independently

Both approaches have advantages and trade-offs.

### When monorepos work well

In my experience, monorepos work best in **small teams** where engineers have strong shared ownership of the entire
codebase.

This setup allows developers to quickly make cross-project changes.
For example, when implementing a new backend endpoint, it can be convenient to immediately update the frontend component
that consumes it.

For small teams and rapid prototyping, this can be very efficient.

### A real-world problem with monorepos

However, monorepos can introduce serious problems as teams grow.

I once worked as a team lead on a project where multiple teams shared a monorepo.
Our team owned a specific service inside the repository.

One day we arrived at work and noticed that:

- our service started behaving incorrectly
- tests were failing
- and the commit history showed changes made by another team

Someone from a neighboring team had modified our module directly in order to unblock their own work.

We discussed the situation and introduced processes:

- versioning rules
- changelog requirements
- deprecation policies

However, the same issue happened again later.

The reason is simple:
when engineers are blocked, modifying someone else's code in a monorepo often feels like the fastest solution.

But in a multi-team environment, **this bypasses the collaboration process**.

The correct approach should look more like this:

1. Introduce the required change
2. Publish a changelog
3. Provide migration instructions
4. Notify dependent teams
5. Allow those teams to schedule upgrades
6. Deprecate the old functionality
7. Remove it only in a future release

Without these steps, teams can accidentally break each other's systems.

### Why repository boundaries matter

If each service had been maintained in **separate repositories**, other teams would not have had direct access to modify
our code.

Instead, they would need to:

- open an issue
- propose a change
- or depend on a versioned release

This creates clear **ownership boundaries** between teams.

### Conclusion

In this project, we follow a **single repository per service approach**.

My general rule of thumb:

- **Growing teams and production systems → separate repositories**
- **Pet projects, MVPs, small teams → monorepo**

Both approaches are valid, but repository boundaries become increasingly important as the number of teams grows.

---

## Infrastructure Repository

Infrastructure code should typically live in a **separate repository**, regardless of whether your application uses a
monorepo or multiple repositories.

There are exceptions to this rule, but in most real-world systems infrastructure evolves independently from application
code.

For this project, Terraform infrastructure is maintained in a dedicated repository:

→ **Prod Forge Infrastructure**
(link to terraform repo)

This separation helps with:

- independent infrastructure changes
- safer deployment workflows
- clearer operational ownership

---

# Development Workflow

<p align="center">
  <img alt="Development Workflow" src="https://github.com/prod-forge/backend/blob/main/assets/development-workflow.png" width="512px" height="386px">
</p>

To support a reliable release pipeline, the development workflow should follow several conventions.

## Task Management

Every feature or fix should be associated with a clearly defined task in the project backlog.

Each task should include:

- description
- acceptance criteria
- issue identifier (e.g. Jira ticket)

## Git Flow

The project follows a simplified Git Flow approach.

Typical workflow:

```text
feature branch → pull request → code review → merge to dev/stage
```

## Branch Naming Convention

Branches follow a predictable naming format:

```shell
feat/XXXX-short-description
```

Where:

- feat indicates the type of change
- XXXX references the task ID (e.g. Jira ticket)
- short-description briefly explains the change

Example:

```shell
feat/1023-user-authentication
```

This makes it easier to trace changes back to project tasks.

## Commit Conventions

Commit messages follow commitlint / conventional commit standards.

This improves readability and allows automatic changelog generation.

Example:

```text
feat(auth): add JWT authentication
fix(api): handle missing query parameters
```

## Feature workflow

1. Create a feature branch
2. Implement the change
3. Open a pull request
4. Pass code review
5. Rebase on `main`
6. Merge into `main`
7. Send the task to testing

## Bug fixing workflow

If a defect is discovered:

1. Create a bugfix branch

```shell
bug-123-fix-null-pointer
```

2. Implement the fix
3. Open a pull request
4. Pass code review
5. Merge after approval

## Code review

Code review is **mandatory for all changes**.

This applies to:

- features
- bug fixes
- refactoring
- infrastructure changes

Consistent branch naming also makes it easy to analyze sprint results and track how issues were resolved.

## Squash Merge Strategy

In this project we use a **hybrid merge strategy** that combines the advantages of both **rebase** and **merge**.

The goal is to keep the `main` branch:

- clean
- linear
- easy to read
- suitable for automated changelog generation

With this approach, all commits from a feature branch are combined into **a single commit** before being added to
`main`.

This preserves a clean project history while still allowing developers to work with multiple commits inside feature
branches.

How to automate this in Github:

> - Open the repository on GitHub.
> - Go to Settings → General.
> - Scroll down to the Pull Requests section.
> - In the Merge button section, disable any unnecessary options:
> - Leave only Allow squash merging enabled.
> - Disable Allow merge commits and Allow rebase merging if you want to prevent other merge types.

## Workflow

Follow the same steps used in a rebase workflow during development:

1. Create a feature branch
2. Implement the feature with multiple commits if needed
3. Rebase the branch on top of the latest `main`

Once the feature is ready to be merged, switch back to the `main` branch and run:

```shell
git merge --squash feat/123-add-user-endpoint
```

This command prepares the merge but **does not create a commit automatically**.

Next, create a single commit that represents the entire feature:

```shell
git commit -m "feat: <some description here>"
```

As a result:

- the full history of the feature branch is compressed into **one commit**
- the `main` branch remains **linear**
- the commit history stays **easy to understand**

## Why this matters

A clean and structured commit history becomes extremely valuable when the project grows.

This approach allows us to:

- generate **automated changelogs**
- simplify release notes
- make code history easier to navigate
- clearly see which commits introduced specific features

The more **atomic and structured** the commits in the `main` branch are, the easier it becomes to manage releases and
maintain the project over time.

# Architecture Decisions

<p align="center">
  <img alt="Architecture Decisions" src="https://github.com/prod-forge/backend/blob/main/assets/arch-decision.png" width="512px" height="541px">
</p>

Choosing the right architecture is rarely a purely technical decision.

In real-world projects, architectural choices are influenced by many external factors such as:

- client requirements
- regulatory constraints
- legacy systems
- security policies
- team expertise
- long-term maintainability

### Client constraints

The most important factor is almost always **the client's requirements and environment**.

In regulated industries such as **Healthcare**, **Insurance**, or **Finance**, even small technical decisions may
require formal approval.

For example, in one healthcare project I worked on, introducing a new library required a review process that lasted
several months. This was necessary due to strict compliance and security requirements.

In such environments, architectural decisions cannot be made purely from an engineering perspective. They must consider:

- compliance policies
- security audits
- internal approval processes
- compatibility with existing systems

These constraints often influence the technology stack far more than developer preferences.

### Understanding the product

Before making any architectural decisions, it is critical to fully understand the product itself.

This usually requires close collaboration with:

- the client
- product owners
- business analysts
- other engineering teams

The goal is to clearly answer one fundamental question:

**What problem are we actually solving?**

Architecture should always support the product's goals, not the other way around.

### Technology selection principles

In addition to functional requirements, I follow several non-functional principles when selecting technologies and
frameworks.

#### 1. Team familiarity

Technology should be familiar to the team working on the project.

Using niche or obscure frameworks often creates unnecessary friction:

- onboarding new engineers becomes harder
- hiring becomes more difficult
- more time is spent fighting the tooling instead of solving business problems

Choosing well-known and widely adopted technologies usually results in more predictable development.

#### 2. Community ecosystem

Large and active communities provide significant advantages:

- better documentation
- more third-party libraries
- faster problem resolution
- more production experience shared by other teams

Strong community support dramatically reduces long-term engineering risks.

#### 3. Opinionated structure

Frameworks with a well-defined structure can help maintain architectural consistency.

For example, **NestJS** encourages a layered architecture and clear module boundaries. While it does not prevent
alternative patterns, it provides a strong starting point for organizing large codebases.

In contrast, more flexible frameworks such as **Express** allow multiple architectural styles, which can lead to
inconsistencies across projects if strong conventions are not established.

#### 4. Stability over hype

New technologies are often presented as revolutionary solutions.

However, the JavaScript ecosystem has seen many frameworks that gained short-term popularity and then disappeared.

For production systems, stability is often more valuable than novelty.

Well-established technologies usually offer:

- better long-term support
- more mature tooling
- fewer unexpected risks

# 2. The Code

Code Quality Tooling as the very first step when starting a new project. We need to set up tools and agree on coding
guidelines to ensure the future code fully complies with our requirements.

## Code Quality

Maintaining consistent code quality is essential for long-term project sustainability.

In this project, code quality is protected by a **five-layer defense system**.

### Layer 1 — Code formatting and consistency

The first layer ensures that the entire codebase follows consistent formatting rules.

We use two tools for this purpose:

- **EditorConfig** — ensures consistent formatting across different editors and IDEs
- **Prettier** — enforces automatic code formatting

These tools eliminate stylistic discussions during code reviews and ensure a uniform code style across the project.

### Layer 2 — Static analysis with ESLint

The second layer introduces stricter rules through **ESLint**.

While ESLint can be configured in many different ways, this project uses the following plugins:

- `typescript-eslint` — TypeScript-specific linting rules
- `eslint-plugin-regexp` — validation and best practices for regular expressions
- `eslint-plugin-prettier` — integration with Prettier
- `eslint-plugin-perfectionist` — sorting of imports and object properties
- `eslint-plugin-package-json` — validation rules for `package.json`
- `eslint-plugin-check-file` — file naming conventions
- `@eslint/json` — additional validation for JSON files
- `@eslint/js` — JavaScript linting support for auxiliary scripts

Even in TypeScript projects, it is useful to lint JavaScript files that may exist in tooling scripts or configuration
files.

ESLint should be integrated with your IDE so that checks run automatically **on save or paste**.

This ensures developers receive immediate feedback during development.

### Layer 3 — Pre-commit protection

The third layer prevents problematic code from entering the repository.

This is implemented using **Husky** and **lint-staged**.

Before each commit:

- ESLint checks are executed
- formatting is validated
- only modified files are analyzed

This ensures that commits do not break the CI pipeline or introduce formatting issues.

### Layer 4 - Commitlint configuration

### Layer 5 — Continuous Integration checks

The final layer runs full validation during the **CI pipeline**.

At this stage the entire codebase is analyzed to ensure:

- linting rules pass
- formatting rules are satisfied
- tests run successfully

This final check acts as a safeguard before any changes are merged into the main branch.

# Configuration Management

<p align="center">
  <img alt="Configuration Management" src="https://github.com/prod-forge/backend/blob/main/assets/configuration-management.png" width="508px" height="523px">
</p>

Managing application configuration is often more complex than it appears.

Modern applications usually have many configuration parameters spread across multiple files and environments. The same
application may run in different environments such as:

- local
- test
- development
- production

A common problem at the start of many projects is keeping configuration documentation up to date. Developers often
struggle to understand how to correctly configure the application locally.

The approach used in this project solves this problem by combining versioned configuration, local overrides, and secure
secret management.

## Environment Configuration Strategy

The configuration system is built around two main files:

```shell
.env.common
```

This is the primary configuration file used for local development.

Characteristics:

- contains all required environment variables
- fully configured for running the application locally
- does not contain sensitive secrets
- committed to the repository

Because this file is versioned, it acts as living documentation for all configuration variables required by the
application.

Example:

```shell
.env.common
```

This file ensures that any developer can clone the repository and run the application without guessing which variables
are required.

```shell
.env
```

This file is used for local overrides.

Sometimes developers need to change specific configuration values locally. For example:

- running a database on a different port
- using a local Redis instance
- modifying debug options

Instead of modifying .env.common, developers can override values in .env.

Example scenario:

A developer needs to override the database port locally.

```shell
DB_PORT=5332
```

Key properties:

- overrides variables defined in .env.common
- not committed to the repository
- optional for developers
- prevents merge conflicts between team members

Each developer may have their own .env file.

## Secret Management

Sensitive secrets such as:

- database passwords
- API keys
- JWT secrets
- third-party credentials

are never stored in environment files inside the repository.

Instead, secrets are injected directly into the container at runtime using Terraform.

This approach provides several important benefits:

- secrets are not visible in the repository
- secrets are not exposed during CI/CD
- secrets are stored securely in infrastructure systems (e.g. AWS Secrets Manager)
- only infrastructure-level access can retrieve them

In practice, secrets are passed to the container during deployment via Terraform configuration.

This significantly reduces the attack surface compared to storing secrets in environment files.

## NestJS Configuration Setup

In this project, NestJS loads configuration from both .env and .env.common.

.env takes precedence over .env.common.

Example configuration:

```typescript
ConfigModule.forRoot({
  envFilePath: [join(process.cwd(), '.env'), join(process.cwd(), '.env.common')],
});
```

The same logic is applied in the database manager:

```shell
config({
  override: false,
  path: [
    join(process.cwd(), '.env'),
    join(process.cwd(), '.env.common'),
  ],
});
```

This ensures that:

1. .env.common provides default values
2. .env can override them locally if needed

## Structured Configuration Modules

At the application level, configuration is divided into semantic modules.

Instead of loading configuration as a large unstructured object, we split it into logical domains such as:

- app
- database
- redis

This makes configuration easier to understand, test, and maintain.

Example configuration module:

```typescript
class AppConfig {
  @IsString()
  APP_DESCRIPTION = packageJson.description || 'Description';

  @IsString()
  APP_HOST = '0.0.0.0';

  @IsString()
  APP_NAME = packageJson.name || 'App';

  @IsNumber()
  @Transform(({ value }) => Number(value))
  APP_PORT = 3000;

  @IsString()
  APP_VERSION = packageJson.version || '1.0.0';
}

export const appConfig = registerAs<AppConfig, ConfigFactory<AppConfigInterface>>(
  'appConfig',
  (): AppConfigInterface => {
    const config = validateConfig(AppConfig);

    return {
      appDescription: config.APP_DESCRIPTION,
      appHost: config.APP_HOST,
      appName: config.APP_NAME,
      appPort: config.APP_PORT,
      appVersion: config.APP_VERSION,
    };
  },
);
```

This approach provides several benefits:

- configuration validation
- typed configuration
- clear separation of concerns
- predictable configuration access

## Accessing Configuration

Configuration values are accessed through NestJS ConfigService.

Example:

```typescript
const configApp = configService.getOrThrow<ConfigType<typeof appConfig>>('appConfig');

await app.listen(configApp.appPort, configApp.appHost);
```

Using getOrThrow ensures that the application fails fast if a required configuration value is missing.

## Why This Approach Works Well

This configuration strategy provides several advantages:

- configuration becomes self-documented
- developers can run the project immediately after cloning
- secrets remain secure and outside the repository
- configuration is type-safe and validated
- configuration is organized into small, predictable modules

As the project grows, this structure allows the configuration system to scale without becoming difficult to maintain.

# Database Management

<p align="center">
  <img alt="Database Management" src="https://github.com/prod-forge/backend/blob/main/assets/database-management.png" width="510px" height="467px">
</p>

Database management is treated as a separate operational layer inside the application.

Working with a database is not just about connecting an ORM — it includes a set of operational tasks such as:

- generating migrations
- applying migrations
- managing database seeds
- running fixtures
- preparing test environments with fake data

Because of this, database operations are isolated inside a dedicated module.

In this project, all database-related tooling lives inside the database-manager directory located at the root of the
repository.

```shell
database-manager/
```

This module acts as a utility layer responsible for managing the database lifecycle.

## Database Scripts

To make database operations predictable and easy to run, all common database commands are exposed through npm scripts.

```json
{
  "db:generate": "prisma generate",
  "db:init": "prisma migrate deploy && prisma generate",
  "db:migrate": "prisma migrate dev --name",
  "db:migration:apply": "npm run db:wait && npm run db:migration:deploy",
  "db:migration:deploy": "prisma migrate deploy",
  "db:seed": "prisma db seed",
  "db:wait": "tsx ./database-manager/wait-for-db.ts"
}
```

This approach provides several benefits:

- consistent developer workflow
- easier CI/CD integration
- predictable database operations

Instead of remembering long CLI commands, developers interact with the database through simple scripts.

## Database Manager in Docker

The database-manager module is included in the production Docker image.

```dockerfile
COPY --from=builder /app/database-manager ./database-manager
```

This ensures that the application container has access to the tools required to run:

- migrations
- database initialization
- seed operations

## Why Not a Separate Database Service?

A common question is why the database manager is not implemented as a separate Docker service or application.

In practice, this adds complexity without providing real benefits.

Database migrations are tightly coupled to the application version. Running migrations in a completely separate service
introduces versioning problems:

- migrations must match the application version
- rollback strategies become more complex
- coordination between services becomes harder

For this reason, the database manager is bundled with the backend application image.

This ensures that the application and its database schema evolve together.

## Working with Migrations

Database migrations should always be treated as forward-only operations.

Unlike application code, migrations are not easily reversible.

Because of this, migrations should be designed carefully.

Avoid aggressive or destructive schema changes whenever possible.

For example:

Instead of immediately dropping a table or column, it is safer to introduce changes gradually across several releases.

Typical strategy:

1. mark fields as deprecated
2. stop using them in the application
3. remove them in a later release

This approach provides flexibility if something goes wrong during deployment.

If the application needs to be rolled back, the database schema will still remain compatible with the previous version.

In container environments such as AWS ECS, this allows fast rollbacks by simply switching to a previous task revision.

## Running Migrations in CI/CD

Database migrations are executed during the deployment pipeline using a one-run ECS task.

This means a temporary ECS task is launched using the same Docker image as the backend application, but instead of
starting the server it performs a single operation — applying migrations.

In practice, this is equivalent to launching a short-lived container that runs:

```shell
prisma migrate deploy
```

After the migrations are applied, the task exits.

This approach provides several advantages:

- migrations run in the same environment as production
- the exact same Docker image is used
- no manual database access is required
- deployment pipelines remain deterministic

If additional operations are required — for example running database seeds — they can be executed using separate one-run
ECS tasks.

Each operational task remains isolated and predictable.

# Project Structure

<p align="center">
  <img alt="Project Structure" src="https://github.com/prod-forge/backend/blob/main/assets/project-structure.png" width="512px" height="406px">
</p>

A well-structured project is critical for long-term maintainability and scalability.

The primary principle when designing the project structure is modularity. Each module should have clear boundaries and a
well-defined responsibility.

Following a modular architecture makes it significantly easier to:

- maintain the codebase
- scale the application
- refactor functionality
- extract parts of the system into separate services if necessary

As the application grows, some modules may evolve into independent services. A modular structure makes this transition
much simpler.

## API Layer

One architectural decision used in this project is separating the API layer from the rest of the application.

Controllers are placed inside a dedicated directory:

```shell
src/api
```

This directory contains everything related to the external interface of the service:

- controllers
- request DTOs
- response DTOs
- query DTOs
- validation logic

Grouping these components together creates a clear boundary between the API layer and the business logic layer.

## Thin Controllers

Controllers should remain thin and focused on handling HTTP concerns only.

A controller should be responsible for:

- defining endpoints
- describing endpoints using Swagger / OpenAPI
- validating request data using DTOs
- validating query parameters
- invoking the appropriate service method

Controllers should not contain business logic.

Instead, they should delegate all domain logic to the service layer.

Example responsibilities of a controller:

- parse incoming requests
- validate DTOs
- call a service
- return a structured response

This keeps controllers predictable and easy to maintain.

## Data Validation and Sanitization

All incoming data should be validated before reaching the service layer.

DTOs should define:

- request payload structure
- query parameters
- response schemas

Additionally, unnecessary or unsafe fields should be removed during validation. This ensures that only explicitly
allowed data reaches the business logic layer.

This approach improves both security and predictability.

## Unified API Responses

One of the most important API design principles is consistent response formatting.

All API responses should follow the same structure, regardless of whether the request succeeds or fails.

Example successful response:

```shell
{
  "data": {}
}
```

Example error response:

```shell
{
  "error": {
    "type": "ValidationError",
    "message": "Invalid request payload"
  }
}
```

Key principles:

- the HTTP status code indicates success or failure
- successful responses return data inside the data field
- error responses contain structured error information

A consistent response format provides several advantages:

- simplifies frontend integration
- improves API predictability
- makes logging and monitoring easier
- reduces ambiguity when handling errors

Maintaining a unified response format across the entire API is a small design decision that has a large long-term impact
on developer experience.

# Error Handling

Errors in backend applications usually fall into several categories.
Understanding these categories helps design a predictable and reliable error-handling strategy.

## Types of Errors

### Business Logic Errors

Business logic errors are typically non-fatal and occur when a user performs an action that violates application rules.

Examples:

- a user tries to register with an already existing email
- insufficient balance for a payment
- invalid state transition

These errors should be communicated clearly to the user, allowing them to correct the issue.

The goal is not just to reject the request, but to provide enough information for the user to understand what went
wrong.

### Database Errors

Database-related errors are often similar to business logic errors, although they originate from the persistence layer.

Example scenarios:

- unique constraint violations
- attempting to insert duplicated data
- invalid foreign key references

In such cases, the application should translate low-level database errors into meaningful user-facing messages.

Users should never see raw database errors.

### Infrastructure Errors

Infrastructure errors occur when the application cannot communicate with external systems.

Examples include:

- database connection failures
- third-party API timeouts
- unavailable infrastructure services

These errors can be critical.

In some cases, the safest strategy is to terminate the service immediately. This approach is known as the fail-fast
principle.

Fail-fast systems stop processing requests when a critical dependency fails and trigger alerts so the issue can be
investigated quickly.

## Custom Errors

To properly handle business logic failures, it is recommended to create custom application errors.

Custom errors allow us to include:

- a clear error message
- an error type
- additional metadata related to the failure

Example use cases:

- UserAlreadyExistsError
- InsufficientBalanceError
- InvalidOrderStateError

Using explicit error classes makes the error handling logic more predictable and easier to maintain.

## Global Exception Handling

A backend application should have a single global exception filter responsible for handling all unhandled errors.

The exception filter performs several important tasks:

- formats API error responses
- hides internal error details from the client
- logs errors
- reports errors to monitoring systems

This ensures that all errors follow the same response format.

## User-Friendly Error Responses

Internal error details should never be exposed to the client, as they may reveal sensitive implementation details.

However, error responses should still be informative and actionable.

Bad example:

```shell
Oops, something went wrong
```

Better example:

```shell
Insufficient funds to complete the transaction
```

If a user can fix the problem, the error message should clearly explain how.

## Error Monitoring (Sentry)

The global exception filter should integrate with an error monitoring system such as Sentry.

Sentry should receive as much contextual information as possible to help debug issues.

Example:

```shell
Sentry.captureException(exception, {
  extra: {
    body: req.body,
    correlationId,
    params: req.params,
    query: req.query,
  },
});
```

Providing request context helps reproduce and investigate errors.

### Correlation ID

The correlation ID is particularly important.

It connects application logs, metrics, and error reports together, allowing engineers to trace the full lifecycle of a
request.

With a correlation ID, it becomes possible to track a failure from the initial request to the final error.

### User Context

Whenever possible, it is also useful to attach user information to the error report.

Example:

```shell
Sentry.setUser({ userId });
```

This can be extremely valuable when investigating production issues.

In some cases, a bug may only affect a specific user or a specific dataset. Having the user identifier allows engineers
to quickly identify the affected account and reproduce the issue.

## Logging and Metrics

The exception filter should also integrate with:

- the application logger
- metrics collection systems

Tracking error metrics allows teams to monitor system health.

Example metric:

```shell
private readonly httpErrors = new Counter({
  name: 'http_errors_total',
  help: 'Total HTTP errors',
  labelNames: ['method', 'route', 'status'],
});
```

These metrics can be exported to monitoring systems such as Prometheus or Grafana, enabling dashboards and alerts based
on error rates.

## Summary

A robust error-handling strategy includes:

- clear classification of errors
- custom business exceptions
- global exception filtering
- user-friendly error responses
- monitoring through Sentry
- correlation IDs for request tracing
- error metrics for observability

Together, these practices significantly improve the reliability and debuggability of production systems.

# Fault Tolerance

Most application errors are not critical and should not cause the entire system to fail.

A well-designed system should continue operating even when some components become temporarily unavailable.

This project demonstrates a simple fault-tolerance strategy using Redis as an example.

## Redis as a Non-Critical Dependency

n this architecture, Redis is treated as a non-critical component.

If Redis becomes unavailable, the system continues functioning using fallback strategies instead of crashing.

Redis integration is implemented inside the redis-manager module.

```shell
src/modules/redis-manager/
```

In this project Redis is used for two main purposes:

- caching
- request throttling (rate limiting)

## Fallback Strategies

Fallback mechanisms are implemented inside the storages directory.

```shell
src/modules/redis-manager/storages/
```

These implementations demonstrate how the system can gracefully degrade when Redis is not available.

## Caching Strategy

Redis caching is considered a performance optimization, not a critical system dependency.

If Redis becomes unavailable, caching is simply skipped and the application reads data directly from the database.

This ensures that the system remains functional even if performance temporarily degrades.

## Throttling Strategy

Rate limiting is more important for system stability, so a fallback is implemented.

If Redis is unavailable, the application switches to an in-memory fallback using a simple Map structure.

This allows the throttling mechanism to continue working, although with some limitations:

- limits apply only per instance
- data resets when the service restarts

Even with these constraints, this fallback provides basic protection against abuse while Redis is unavailable.

## Graceful Degradation

This approach is an example of graceful degradation.

Instead of failing completely when a dependency is unavailable, the system reduces functionality while keeping the core
service operational.

Key principles demonstrated here:

- treat optional components as optional
- implement fallback mechanisms where possible
- keep the core application functional

This strategy significantly improves the reliability of production systems.

# Testing

## Unit Tests

According to the testing pyramid, most of the application logic should be covered by unit tests.

The ideal scenario is to test each business logic service independently.

Every service test should include:

- positive cases — expected successful behavior
- negative cases — validation failures and error scenarios

Testing both scenarios ensures that the service behaves correctly under different conditions.

Test only public methods. There's no point in covering the module's implementation with tests; we're only interested in
the execution results.

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

Instead of directly calling internal services, tests interact with the application through its public interface — the
HTTP API.

The typical testing workflow looks like this:

1. start the application with test dependencies
2. send HTTP requests to the API
3. verify the responses

In this project, HTTP requests are executed using Supertest.

This approach allows tests to simulate real client interactions with the system while maintaining full control over the
test environment.

### Test specs design style

I can recommend the following format for writing test specs:

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

We'll have a general description for the feature being tested. It's divided into negative and positive cases. We'll
describe the negative ones first, then the positive ones.

## Summary

The testing approach used in this project combines:

- unit tests for fast validation of business logic
- mocked dependencies for isolation
- Testcontainers for realistic integration testing
- E2E tests for validating the application as a whole

Together, these layers provide confidence that the system behaves correctly across both isolated components and full
application workflows.

# Logging & Observability

Logging is one of the most important parts of building production systems.

Once an application is deployed to production, logs become the primary feedback channel that allows engineers to
understand what is happening inside the system.

The better your logging strategy is designed, the easier it becomes to:

- diagnose production issues
- investigate incidents
- understand system behavior
- track request flows

## Application Logging

In this project the logging system is built on top of Pino, a high-performance Node.js logger.

The logger uses structured logging with built-in log levels.

Each log entry contains the following fields:

- application name
- timestamp
- correlation ID
- log level
- message
- context

Example log structure:

```json
{
  "level": 30,
  "timestamp": "2026-03-12T16:05:49.626Z",
  "env": "development",
  "appName": "Todo_inst1",
  "correlationId": "4209c5e7-bf00-45d1-87c9-ef9db57f8da5",
  "levelName": "info",
  "pid": 61190,
  "ctx": "loggingMiddleware",
  "method": "GET",
  "msg": "Request income"
}
```

This format is intentionally designed to be machine-readable, which allows logs to be easily parsed and visualized in
tools such as Grafana.

## What Should Be Logged

Logging every layer of the application is not recommended.

For example, logging every database query error is usually unnecessary if the error is correctly handled and never
reaches the global exception handler.

A good rule of thumb is:

_Log application-level events, not internal implementation details._

Typical examples of useful logs:

- incoming requests
- business operations
- important state changes
- unexpected errors

During development, it can still be useful to enable additional logs (for example ORM query logging) in order to debug
SQL queries generated by the ORM.

## GDPR Considerations

Logging must always respect privacy and security regulations.

Sensitive user data should never be logged.

Avoid logging:

- email addresses
- usernames
- passwords
- credit card information
- authentication tokens

Logs are usually stored for a period of time and often accessible to multiple systems.
If logs are compromised, any sensitive information stored inside them may also be exposed.

For the same reason, when sending errors to monitoring systems such as Sentry, it is recommended to only attach minimal
user context:

```typescript
Sentry.setUser({ userId });
```

Using only a userId allows engineers to identify the affected user in the database without exposing personal data.

## Correlation ID

A Correlation ID is used to connect all logs that belong to the same request.

Each incoming request receives a unique identifier which is propagated through the entire application.

This allows engineers to reconstruct the full request flow when debugging issues.

For example:

```shell
Request → Controller → Service → Database → Response
```

All logs generated during this flow will contain the same correlationId.

This becomes extremely useful when investigating production errors.

## Context

In the context, we can write, for example, the name of the method in which this log is executed, or something that will
make it clear WHERE it was logged.

## Observability Stack

This project includes a basic observability stack that allows engineers to monitor logs and system metrics.

The stack consists of the following components:

- Promtail – log collector
- Loki – log storage and indexing
- Grafana – visualization and dashboards
- Prometheus – metrics collection system

## Logging Pipeline

The logging workflow in this project looks like this:

1. The application writes logs to stdout inside the container.
2. Promtail collects logs from the container runtime.
3. Promtail sends logs to Loki.
4. Loki indexes and stores logs.
5. Grafana queries Loki to visualize logs and build dashboards.

```shell
Application → stdout → Promtail → Loki → Grafana
```

This approach follows the cloud-native logging model, where applications do not manage log files directly.

## Dashboards

Preconfigured dashboards can be found in:

```shell
observability/dashboards
```

<p align="center">
  <img alt="Dashboard" src="https://github.com/prod-forge/backend/blob/main/assets/grafana-dashboard.jpeg" width="640px" height="397px">
</p>

These dashboards provide visualization for:

- application logs
- system metrics
- database activity

They serve as a starting point for building more advanced monitoring setups.

## Metrics with Prometheus

In addition to logs, the application also exposes metrics using Prometheus.

Prometheus periodically scrapes metrics from the application endpoint (usually /metrics).

These metrics can include:

- request counts
- request latency
- error rates
- database metrics
- custom application metrics

NestJS integrates well with Prometheus through middleware that exposes metrics in the Prometheus format.

Example metric:

```shell
http_requests_total{method="GET",route="/tasks",status="200"} 42
```

Grafana can then use Prometheus as a data source to build dashboards and alerts based on these metrics.

## Why Observability Matters

Combining structured logging, metrics, and monitoring dashboards allows teams to quickly:

- detect production issues
- investigate failures
- analyze system performance
- track error rates

A well-designed observability system is essential for operating production-grade applications.

# Documentation

For most backend services, maintaining a large and complex documentation system is unnecessary.

Full documentation portals (for example using Docusaurus) make sense when you are building:

- public APIs
- SDKs
- shared libraries used by multiple teams
- developer platforms

In such cases, detailed documentation with usage examples, integration guides, and edge cases becomes essential.

However, for a typical backend service or internal API, maintaining a separate documentation platform often becomes a
burden. Documentation can quickly become outdated because developers must constantly synchronize:

- code changes
- integration examples
- API behavior
- documentation links

For most projects, a simpler approach works better.

## Recommended Documentation Structure

This project keeps documentation lightweight and close to the codebase.

Key documentation files include:

### README.md

The main entry point for developers. It should explain:

- project purpose
- architecture overview
- setup instructions
- development workflow

### Swagger / OpenAPI

Swagger serves as the primary API documentation for developers and QA engineers.

It provides:

- endpoint descriptions
- request/response schemas
- validation rules
- example requests

In this project, Swagger also includes custom decorators that simplify repetitive patterns such as pagination.

It is important to document not only successful responses, but also error responses, so that API consumers understand
all possible outcomes.

## Additional Useful Documents

### CHANGELOG.md

Tracks the evolution of the project:

- new features
- bug fixes
- breaking changes

This file helps developers understand how the system evolved over time.

### Incident Log

Production incidents are rare, but when they occur they should always be documented.

An incident log typically includes:

- when the incident occurred
- what caused the issue
- how it was resolved
- what measures were introduced to prevent it in the future

This becomes especially important if a system was compromised or experienced a serious outage.

Incident documentation is extremely useful for:

- internal audits
- improving operational processes
- long-term system reliability

### Feature Change Log

In some teams, business analysts maintain documentation describing how product features evolve over time.

This documentation records:

- the original behavior of a feature
- what changes were introduced
- why the change was made

From an engineering perspective, this helps developers better understand the business logic behind the product.

### Roadmap

When working on small projects without clearly defined processes or a clear understanding of future business objectives
expressed in Jira tasks, we can use a roadmap.md document that includes a set of features we will be implementing in the
near future.

# Performance

Performance optimization is a complex topic and heavily depends on the specific project and workload.

However, there are several general principles that apply to most backend systems.

## Avoid Returning Unnecessary Data

Do not return large payloads if they are not required.

This improves:

- API performance
- bandwidth usage
- security (less data exposure)

## Use Pagination for Collections

Endpoints that return collections should always support pagination.

This prevents:

- large database queries
- excessive memory usage
- slow responses

Pagination also makes APIs easier to consume.

## Use Database Indexes (When Needed)

Indexes can significantly improve database performance for frequently queried fields.

However, they should be used carefully.

Too many indexes can negatively affect:

- write performance
- storage usage

Indexes should be introduced only when necessary.

## Response Compression

In some cases it may be beneficial to compress responses using gzip.

Example configuration:

```typescript
app.use(compression({ threshold: 1024 }));
```

In this example compression is applied only to responses larger than 1 KB.

Compression can reduce network traffic, but it should be used only when it provides real benefits.

# Security

Security is a broad topic that depends heavily on the specific system architecture and threat model.

However, several baseline practices should be implemented in any backend API.

## Request Validation

All incoming data should be validated using DTOs.

NestJS provides a built-in validation pipeline based on class-validator.

Example global validation configuration:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    exceptionFactory: (errors: ValidationError[] = []) => {
      throw new DtoValidationErrors(parseValidationErrors(errors));
    },
    forbidNonWhitelisted: true,
    stopAtFirstError: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
    validationError: { target: false, value: false },
    whitelist: true,
  }),
);
```

This configuration ensures:

- unknown properties are rejected
- validation stops at the first error
- input data is safely transformed
- sensitive validation details are hidden

## Response Data Sanitization

Outgoing responses should also be sanitized.

DTOs can be used to ensure that only explicitly allowed fields are returned.

Example:

```typescript
return plainToInstance(TodoResponseDto, created, {
  excludeExtraneousValues: true,
});
```

This prevents accidental exposure of internal fields.

## Security Headers

Basic HTTP security headers can be enabled using Helmet.

Example configuration:

```typescript
if (environmentService.isProduction()) {
  app.use(
    helmet({
      hsts: {
        includeSubDomains: true,
        maxAge: 31536000,
        preload: true,
      },
    }),
  );
}
```

Helmet helps protect against several common web vulnerabilities.

## CORS Configuration

CORS should be configured carefully to restrict which origins are allowed to access the API.

Example:

```typescript
app.enableCors({
  credentials: true,
  origin: (origin, cb) => {
    if (!origin) {
      return configApi.apiAllowNonBrowserOrigins ? cb(null, true) : cb(null, false);
    }

    return configApi.apiAllowedOrigins.includes(origin) ? cb(null, true) : cb(null, false);
  },
});
```

This allows only trusted origins to access the API.

## Rate Limiting

The project uses **@nestjs/throttler** to limit incoming request rates.

This helps protect the API from:

- abuse
- brute-force attacks
- accidental traffic spikes

Rate limiting can be disabled in development environments to avoid interfering with testing.

## File Upload Security

If your API accepts file uploads, additional validation and sanitization are required.

Simply validating file type is not enough.

For example, SVG files may contain embedded JavaScript code. If such files are processed by server-side tools (e.g.,
rendering libraries), malicious code could potentially be executed.

Therefore uploaded files should always be:

- validated
- sanitized
- safely processed

## Summary

Building a secure and performant backend system requires attention to multiple layers:

- clear documentation
- efficient data handling
- proper request validation
- strict response filtering
- secure HTTP configuration
- rate limiting
- safe file processing

Applying these practices creates a solid baseline for production-ready APIs.

# Release Management

<p align="center">
  <img alt="Release Management" src="https://github.com/prod-forge/backend/blob/main/assets/release-management.png" width="512px" height="281px">
</p>

Releasing software is not just a technical step — it is a structured process that ensures new functionality can be
delivered safely, predictably, and repeatedly.

A well-defined release process allows teams to:

- deliver features consistently
- minimize production risks
- maintain clear version history
- quickly rollback when necessary

This section describes how releases are managed in this project.

## Release Strategy

One of the most important questions in release management is:

> When should we release?

The answer often depends on the development methodology used by the team.

If the project follows Scrum, the recommended strategy is to produce a release at the end of every sprint.

This approach allows teams to:

- gather feedback early
- validate product assumptions
- reduce the risk of large, unstable releases

A key requirement for successful sprint releases is proper scope management.

Sprint goals must be realistic. If a task is too large to complete within a sprint, it should be split into smaller
increments that gradually expand the feature.

Example:

Instead of implementing a complex recommendation system in a single sprint:

Sprint 1:

- simple product recommendation based on a single factor

Sprint 2:

- improved ranking algorithm

Sprint 3:

- personalization using user behavior

This incremental approach ensures that users receive value early while the system evolves over time.

## Creating a Release

When all features planned for the sprint are merged into the release branch (e.g. dev, stage, or main), the release
process can begin.

Releases are created using the following command:

```shell
npm run release
```

This project uses the **release-it** library to automate release tasks.

## Release Automation

The release-it tool automates several important steps:

- version bumping
- changelog generation
- git tagging
- pushing release commits

Before starting the release, a checklist is shown to ensure the project is ready.

Example checklist:

- All changes are committed
- All tasks related to the release are closed
- CHANGELOG is updated
- Migration guide is prepared (if needed)

After confirmation:

1. release-it determines the next version
2. generates the changelog from git history
3. creates a git tag
4. pushes the release commit

## Versioning

The project follows Semantic Versioning (SemVer).

Version format:

```text
vMAJOR.MINOR.PATCH
```

Example:

```text
v1.0.0
```

Rules:

### MAJOR

Breaking changes in API or behavior.

### MINOR

New backward-compatible features.

### PATCH

Bug fixes and small improvements.

The v prefix is required so that GitHub Actions can detect the release tag and trigger the deployment pipeline.

## Continuous Integration (CI)

Continuous Integration ensures that every change introduced to the repository is automatically validated.

This project uses GitHub Actions for CI.

The CI pipeline runs automatically when code is pushed to important branches.

Typical CI stages include:

### Linting

Ensures the code follows project style and formatting rules.

This step prevents:

- style violations
- formatting issues
- some common mistakes

### Unit Tests

Unit tests verify the correctness of business logic.

They are fast to run and should always be part of the CI pipeline.

### End-to-End Tests

E2E tests validate the full application workflow.

Because they may take longer to run, many teams run them:

- on release builds
- before merging into main or stage

### Build

The final CI step verifies that the application can be successfully built.

In this project the application is built as a Docker container.

If the build fails, the release cannot proceed.

### Optional Quality Gates

Some teams also include additional checks such as:

- static analysis (SonarQube)
- dependency vulnerability scanning
- code coverage thresholds

These checks help maintain long-term code quality.

## Continuous Deployment (CD)

Continuous Deployment is responsible for delivering the new version to production infrastructure.

The CD pipeline extends the CI pipeline with deployment steps.

Typical deployment workflow:

1. Build Docker image
2. Tag image using the release version
3. Push image to AWS ECR
4. Run one-time ECS task to apply database migrations
5. Deploy new ECS task definition
6. Update ECS service
7. Cleanup

Once AWS replaces the running containers with the new version, the deployment is complete.

### Database Migration Step

Database migrations are executed as a one-time ECS task.

This ensures:

- migrations run in the same environment as the application
- the deployment process remains fully automated

Because migrations follow a forward-only strategy, schema updates should not break the currently running version of the
application.

This allows safe rolling deployments.

### Revision Cleanup

After a successful deployment, old ECS task revisions are cleaned up.

However, the system keeps the last three revisions.

This allows fast rollback if needed.

## Rollback Strategy

Rollback is one of the most critical parts of production operations.

If something goes wrong after deployment, the system must be able to restore the previous working version quickly.

This project keeps the three most recent ECS revisions available.

Rollback does not require modifying code or pushing new commits.

Instead, rollback is performed using GitHub Actions workflows.

### Step 1 — Show Available Revisions

Workflow:

```text
Show ECS 3 Last Revisions
```

This displays the last three ECS task revisions.

### Step 2 — Rollback

Workflow:

```text
Rollback ECS Revision
```

To rollback:

1. copy the desired revision number
2. run the rollback workflow
3. paste the revision number

AWS will redeploy the selected revision.

Rollback typically takes less than one minute.

### Important Note About Migrations

Database migrations follow a forward-only approach.

Down migrations are intentionally avoided because they can lead to:

- data corruption
- inconsistent schema states

Because of this rule:

- breaking database changes should be avoided
- large schema modifications should only happen in major releases

This ensures that application rollbacks remain safe.

## Summary

The release management workflow in this project provides:

- structured development practices
- automated release generation
- reliable CI/CD pipelines
- safe database migration strategy
- fast rollback capability

Together these practices ensure that the system can evolve safely while maintaining high deployment confidence.
