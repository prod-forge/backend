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

## Git Workflow

A consistent Git workflow is critical for team collaboration.

When starting work on a feature, developers should:

1. Pull the latest changes from `main`
2. Create a new branch using a predefined naming convention

Example:

```shell
feature-123-add-user-endpoint
bug-245-fix-auth-error
```

Where:

- `123` is the issue ID (for example from Jira)
- the rest describes the change

### Feature workflow

1. Create a feature branch
2. Implement the change
3. Open a pull request
4. Pass code review
5. Rebase on `main`
6. Merge into `main`
7. Send the task to testing

### Bug fixing workflow

If a defect is discovered:

1. Create a bugfix branch

```shell
bug-123-fix-null-pointer
```

2. Implement the fix
3. Open a pull request
4. Pass code review
5. Merge after approval

### Squash Merge Strategy

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

### Workflow

Follow the same steps used in a rebase workflow during development:

1. Create a feature branch
2. Implement the feature with multiple commits if needed
3. Rebase the branch on top of the latest `main`

Once the feature is ready to be merged, switch back to the `main` branch and run:

```shell
git merge --squash feature-123-add-user-endpoint
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

### Why this matters

A clean and structured commit history becomes extremely valuable when the project grows.

This approach allows us to:

- generate **automated changelogs**
- simplify release notes
- make code history easier to navigate
- clearly see which commits introduced specific features

The more **atomic and structured** the commits in the `main` branch are, the easier it becomes to manage releases and
maintain the project over time.

### Code review

Code review is **mandatory for all changes**.

This applies to:

- features
- bug fixes
- refactoring
- infrastructure changes

Consistent branch naming also makes it easy to analyze sprint results and track how issues were resolved.

## Architecture Decisions

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

# Project Structure

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
