<p align="center">
  <img alt="Prod Forge" src="https://raw.githubusercontent.com/prod-forge/.github/main/assets/prod-forge-logo.png" width="264px" height="243px">
</p>

_AI made writing the code easy. Running it in production is still hard._

This repository is the main guide: a NestJS Todo API taken from the first commit to production, covering quality gates, CI/CD, migrations, observability and rollback. It answers: how do I build and operate a production-ready API?

Part of Prod Forge — start with the organization overview: https://github.com/prod-forge

## Stack

<!-- prettier-ignore -->
| Layer          | Tools                                            |
| -------------- | ------------------------------------------------ |
| Backend        | NestJS · Prisma · PostgreSQL · Redis · Docker    |
| Observability  | Prometheus · Grafana · Loki · Promtail · Tempo   |
| Quality        | ESLint · Prettier · Husky · Commitlint · CI/CD   |

The full stack table is on the organization page: https://github.com/prod-forge

## Getting started

Requires Node 24, Docker with Compose >= 2.24 (`env_file` with `required: false`) and `jq`.

```shell
npm install
npm run db:generate                   # Prisma client (gitignored); lint, tests and start need it
docker compose up -d database cache   # works without .env, using local defaults user/user/app
printf 'DATABASE_PORT=5332\nJWT_SECRET=%s\n' "$(openssl rand -hex 32)" >> .env   # 5332 is the compose DB host port (.env.common says 5432); JWT_SECRET needs >= 32 chars; append, never overwrite
npm run db:migration:deploy && npm run db:seed
npm run start:dev                     # API on http://localhost:3000, Swagger on /docs
./scripts/verify-observability.sh     # app in Docker plus Prometheus, Grafana, Loki, Tempo, checked end to end
```

Grafana runs on `http://localhost:3001` (`admin` / `admin`). Details:
[Running the Stack Locally](docs/logging-observability.md#running-the-stack-locally).

# Table of contents

- [1. Repository Strategy](docs/repository-strategy.md)
  - [When Monorepos Work Well](docs/repository-strategy.md#when-monorepos-work-well)
  - [A Real-World Problem With Monorepos](docs/repository-strategy.md#a-real-world-problem-with-monorepos)
  - [Why Repository Boundaries Matter](docs/repository-strategy.md#why-repository-boundaries-matter)

<!-- -->

- [2. Architecture Decisions](docs/architecture-decisions.md)
  - [Client Constraints](docs/architecture-decisions.md#client-constraints)
  - [Understanding The Product](docs/architecture-decisions.md#understanding-the-product)
  - [Technology Selection Principles](docs/architecture-decisions.md#technology-selection-principles)
    - [1. Team Familiarity](docs/architecture-decisions.md#1-team-familiarity)
    - [2. Community Ecosystem](docs/architecture-decisions.md#2-community-ecosystem)
    - [3. Opinionated Structure](docs/architecture-decisions.md#3-opinionated-structure)
    - [4. Stability Over Hype](docs/architecture-decisions.md#4-stability-over-hype)

<!-- -->

- [3. Development Workflow](docs/development-workflow.md)
  - [Task Management](docs/development-workflow.md#task-management)
  - [Git Flow](docs/development-workflow.md#git-flow)
    - [Branch Naming Convention](docs/development-workflow.md#branch-naming-convention)
    - [Commit Conventions](docs/development-workflow.md#commit-conventions)
  - [Feature Workflow](docs/development-workflow.md#feature-workflow)
  - [Bug Fixing Workflow](docs/development-workflow.md#bug-fixing-workflow)
  - [Code Review](docs/development-workflow.md#code-review)
  - [Squash Merge Strategy](docs/development-workflow.md#squash-merge-strategy)
  - [Squash Merge Workflow](docs/development-workflow.md#squash-merge-workflow)
  - [Why This Matters](docs/development-workflow.md#why-this-matters)

<!-- -->

- [4. AI-Assisted Development](docs/ai-development.md)
  - [Quality Gates First](docs/ai-development.md#quality-gates-first)
  - [Architecture Before Generation](docs/ai-development.md#architecture-before-generation)
  - [Workflow](docs/ai-development.md#workflow)
    - [Input Modes](docs/ai-development.md#input-modes)
    - [Plan, Then Implement](docs/ai-development.md#plan-then-implement)
    - [Save Your Prompts](docs/ai-development.md#save-your-prompts)
  - [Project Knowledge Files](docs/ai-development.md#project-knowledge-files)
    - [MEMORY.md](docs/ai-development.md#memorymd)
    - [REVIEW.md](docs/ai-development.md#reviewmd)
    - [docs/](docs/ai-development.md#docs)
    - [Skills](docs/ai-development.md#skills)
  - [Pre-Hooks](docs/ai-development.md#pre-hooks)
    - [Protected Files (Edit|Write)](docs/ai-development.md#protected-files-editwrite)
    - [Blocked Commands (Bash)](docs/ai-development.md#blocked-commands-bash)
  - [Task Decomposition](docs/ai-development.md#task-decomposition)
  - [Common AI Problems](docs/ai-development.md#common-ai-problems)
  - [Cost Optimization](docs/ai-development.md#cost-optimization)
  - [Quality Control](docs/ai-development.md#quality-control)
    - [Commit Frequently](docs/ai-development.md#commit-frequently)
    - [Validate Edge Cases](docs/ai-development.md#validate-edge-cases)
    - [Mandatory Code Review](docs/ai-development.md#mandatory-code-review)
    - [Never Trust AI Blindly](docs/ai-development.md#never-trust-ai-blindly)
  - [Recommended Workflow](docs/ai-development.md#recommended-workflow)

<!-- -->

- [5. Code Quality](docs/code-quality.md)
  - [Layer 1. Code Formatting And Consistency](docs/code-quality.md#layer-1-code-formatting-and-consistency)
  - [Layer 2. Static Analysis With ESLint](docs/code-quality.md#layer-2-static-analysis-with-eslint)
  - [Layer 3. Pre-commit Protection](docs/code-quality.md#layer-3-pre-commit-protection)
  - [Layer 4. Commitlint Configuration](docs/code-quality.md#layer-4-commitlint-configuration)
  - [Layer 5. Continuous Integration Checks](docs/code-quality.md#layer-5-continuous-integration-checks)
  - [Layer 6. Dependency Locking](docs/code-quality.md#layer-6-dependency-locking)

<!-- -->

- [6. Documentation](docs/documentation.md)
  - [Recommended Documentation Structure](docs/documentation.md#recommended-documentation-structure)
    - [README.md](docs/documentation.md#readmemd)
    - [Swagger / OpenAPI](docs/documentation.md#swagger--openapi) (committed contract: [docs/openapi.json](docs/openapi.json))
  - [Additional Useful Documents](docs/documentation.md#additional-useful-documents)
    - [CHANGELOG.md](docs/documentation.md#changelogmd)
    - [Incident Log](docs/documentation.md#incident-log)
    - [Feature Change Log](docs/documentation.md#feature-change-log)
    - [Roadmap](docs/documentation.md#roadmap)

<!-- -->

- [7. Configuration Management](docs/configuration-management.md)
  - [Environment Configuration Strategy](docs/configuration-management.md#environment-configuration-strategy)
  - [Secret Management](docs/configuration-management.md#secret-management)
  - [Test Environment Overrides](docs/configuration-management.md#test-environment-overrides)
  - [NestJS Configuration Setup](docs/configuration-management.md#nestjs-configuration-setup)
  - [Structured Configuration Modules](docs/configuration-management.md#structured-configuration-modules)
  - [Accessing Configuration](docs/configuration-management.md#accessing-configuration)
  - [Why This Approach Works Well](docs/configuration-management.md#why-this-approach-works-well)

<!-- -->

- [8. Database Management](docs/database-management.md)
  - [Database Scripts](docs/database-management.md#database-scripts)
  - [Database Manager in Docker](docs/database-management.md#database-manager-in-docker)
  - [Why Not a Separate Database Service?](docs/database-management.md#why-not-a-separate-database-service)
  - [Working with Migrations](docs/database-management.md#working-with-migrations)
    - [Running Migrations in CI/CD](docs/database-management.md#running-migrations-in-cicd)

<!-- -->

- [9. Project Structure](docs/project-structure.md)
  - [API Layer](docs/project-structure.md#api-layer)
    - [Thin Controllers](docs/project-structure.md#thin-controllers)
  - [Data Validation and Sanitization](docs/project-structure.md#data-validation-and-sanitization)
  - [Unified API Responses](docs/project-structure.md#unified-api-responses)

<!-- -->

- [10. Fault Tolerance](docs/fault-tolerance.md)
  - [Fault vs Failure](docs/fault-tolerance.md#fault-vs-failure)
  - [Non-Critical Dependency](docs/fault-tolerance.md#non-critical-dependency)
    - [Fallback Strategies](docs/fault-tolerance.md#fallback-strategies)
      - [Caching Strategy](docs/fault-tolerance.md#caching-strategy)
      - [Throttling Strategy](docs/fault-tolerance.md#throttling-strategy)
  - [Types of Fault Tolerance](docs/fault-tolerance.md#types-of-fault-tolerance)
    - [High Availability](docs/fault-tolerance.md#high-availability)
    - [Graceful Degradation](docs/fault-tolerance.md#graceful-degradation)
  - [In-Flight Requests Handling](docs/fault-tolerance.md#in-flight-requests-handling)
  - [Critical Dependency](docs/fault-tolerance.md#critical-dependency)

<!-- -->

- [11. Error Handling](docs/error-handling.md)
  - [Types of Errors](docs/error-handling.md#types-of-errors)
    - [Business Logic Errors](docs/error-handling.md#business-logic-errors)
    - [Database Errors](docs/error-handling.md#database-errors)
    - [Infrastructure Errors](docs/error-handling.md#infrastructure-errors)
  - [Custom Errors](docs/error-handling.md#custom-errors)
  - [Global Exception Handling](docs/error-handling.md#global-exception-handling)
  - [User-Friendly Error Responses](docs/error-handling.md#user-friendly-error-responses)
  - [Error Monitoring (Sentry)](docs/error-handling.md#error-monitoring-sentry)
    - [Trace ID](docs/error-handling.md#trace-id)
    - [User Context](docs/error-handling.md#user-context)
  - [Logging and Metrics](docs/error-handling.md#logging-and-metrics)

<!-- -->

- [12. Logging & Observability](docs/logging-observability.md)
  - [Application Logging](docs/logging-observability.md#application-logging)
  - [What Should Be Logged](docs/logging-observability.md#what-should-be-logged)
  - [GDPR Considerations](docs/logging-observability.md#gdpr-considerations)
  - [Trace ID](docs/logging-observability.md#trace-id)
  - [Context](docs/logging-observability.md#context)
  - [Distributed Tracing](docs/logging-observability.md#distributed-tracing)
    - [Coexistence with Sentry](docs/logging-observability.md#coexistence-with-sentry)
    - [Context propagation](docs/logging-observability.md#context-propagation)
    - [Sampling and cost](docs/logging-observability.md#sampling-and-cost)
  - [Observability Stack](docs/logging-observability.md#observability-stack)
  - [Running the Stack Locally](docs/logging-observability.md#running-the-stack-locally)
  - [Logging Pipeline](docs/logging-observability.md#logging-pipeline)
  - [Dashboards](docs/logging-observability.md#dashboards)
  - [Metrics with Prometheus](docs/logging-observability.md#metrics-with-prometheus)
  - [Alerting and SLOs](docs/logging-observability.md#alerting-and-slos)
  - [Why Observability Matters](docs/logging-observability.md#why-observability-matters)
  - [Health Checks and Terminus](docs/logging-observability.md#health-checks-and-terminus)
    - [Critical vs Optional Dependencies](docs/logging-observability.md#critical-vs-optional-dependencies)
    - [/health (Critical)](docs/logging-observability.md#health-critical)
      - [Readiness](docs/logging-observability.md#readiness)
    - [/health/live (Liveness)](docs/logging-observability.md#healthlive-liveness)
    - [/health/deps (All)](docs/logging-observability.md#healthdeps-all)
      - [Optional Dependencies Handling](docs/logging-observability.md#optional-dependencies-handling)

<!-- -->

- [13. Testing](docs/testing.md)
  - [Unit Tests](docs/testing.md#unit-tests)
    - [Mocking Dependencies](docs/testing.md#mocking-dependencies)
  - [End-to-End Tests (E2E)](docs/testing.md#end-to-end-tests-e2e)
    - [Test Environment Setup](docs/testing.md#test-environment-setup)
    - [Writing Effective E2E Tests](docs/testing.md#writing-effective-e2e-tests)
  - [Test Specs Design Style](docs/testing.md#test-specs-design-style)
  - [What E2E Covers](docs/testing.md#what-e2e-covers)
  - [Load Testing](docs/testing.md#load-testing)

<!-- -->

- [14. Performance](docs/performance.md)
  - [Avoid Returning Unnecessary Data](docs/performance.md#avoid-returning-unnecessary-data)
  - [Use Pagination for Collections](docs/performance.md#use-pagination-for-collections)
  - [Use Database Indexes (When Needed)](docs/performance.md#use-database-indexes-when-needed)
  - [Response Compression](docs/performance.md#response-compression)

<!-- -->

- [15. Security](docs/security.md)
  - [Request Validation](docs/security.md#request-validation)
  - [Response Data Sanitization](docs/security.md#response-data-sanitization)
  - [Security Headers](docs/security.md#security-headers)
  - [CORS Configuration](docs/security.md#cors-configuration)
  - [Rate Limiting](docs/security.md#rate-limiting)
  - [File Upload Security](docs/security.md#file-upload-security)

<!-- -->

- [16. Release Management](docs/release-management.md)
  - [Release Strategy](docs/release-management.md#release-strategy)
  - [Creating a Release](docs/release-management.md#creating-a-release)
    - [Release Automation](docs/release-management.md#release-automation)
      - [Versioning](docs/release-management.md#versioning)
        - [MAJOR](docs/release-management.md#major)
        - [MINOR](docs/release-management.md#minor)
        - [PATCH](docs/release-management.md#patch)
  - [Continuous Integration (CI)](docs/release-management.md#continuous-integration-ci)
    - [Linting](docs/release-management.md#linting)
    - [Unit Tests](docs/release-management.md#unit-tests)
    - [End-to-End Tests](docs/release-management.md#end-to-end-tests)
    - [Build](docs/release-management.md#build)
    - [Optional Quality Gates](docs/release-management.md#optional-quality-gates)
  - [Continuous Deployment (CD)](docs/release-management.md#continuous-deployment-cd)
    - [GitHub Variables](docs/release-management.md#github-variables)
    - [Database Migration Step](docs/release-management.md#database-migration-step)
      - [Important Note About Migrations](docs/release-management.md#important-note-about-migrations)
    - [Revision Cleanup](docs/release-management.md#revision-cleanup)
  - [Rollback Strategy](docs/release-management.md#rollback-strategy)
    - [Step 1 - Show Available Revisions](docs/release-management.md#step-1---show-available-revisions)
    - [Step 2 - Rollback](docs/release-management.md#step-2---rollback)
  - [Debugging in Production](docs/release-management.md#debugging-in-production)

# Conclusion

Building software is not just about writing code.

Most engineers learn the craft of coding early in their careers. But the gap between writing working code and running a
reliable system in production is wide - and rarely documented in one place.

This project is an attempt to close that gap.

Not by providing a magic template you can clone and ship. But by walking through every decision that happens before,
during, and after the code is written.

The stack used here - NestJS, Postgres, Redis, Terraform, AWS - is not the point. These are just tools. The principles
behind them apply to almost any production backend, regardless of language or cloud provider.

What matters is the thinking:

- Why does repository structure affect team velocity?
- Why does commit discipline make releases safer?
- Why does observability matter before something breaks?
- Why does a rollback plan need to exist before you need it?

These are not advanced topics. They are basic requirements for any system that real users depend on.
The goal of Prod Forge is to make these practices visible, understandable, and reusable.

## What comes next

Open work is tracked in the [roadmap](roadmap.md) and summarized on the [organization page](https://github.com/prod-forge).

## A final thought

The best time to set up these practices is at the beginning of a project.

The second best time is now.

A system without observability is a system you cannot debug under pressure. A team without a defined workflow is a team
that slows down as it grows. A deployment without a rollback plan is a deployment that will eventually cause an incident
with no recovery path.

None of these things are difficult to set up. They are just easy to skip.
This project exists as a reminder not to skip them.

# Intentionally out of scope

- Identity provider and password management: the API verifies signed tokens and ships a login stub, see [Authentication and Authorization](docs/security.md#authentication-and-authorization)
- Cursor pagination: list endpoints use offset pagination with `count(*)`, which is enough for the Todo scale, see [Performance](docs/performance.md#offset-vs-cursor-pagination)

# Contributing

We welcome any kind of contribution, please read the guidelines:

[CONTRIBUTING](CONTRIBUTING.md)

# The MIT License

[LICENSE](LICENSE)
