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

Requires Node 24.15 or newer (CI and the image run Node 26), Docker with Compose >= 2.24 (`env_file` with `required: false`) and `jq`.

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
[Running the Stack Locally](guide/logging-observability.md#running-the-stack-locally).

# Table of contents

- [1. Repository Strategy](guide/repository-strategy.md)
  - [When Monorepos Work Well](guide/repository-strategy.md#when-monorepos-work-well)
  - [A Real-World Problem With Monorepos](guide/repository-strategy.md#a-real-world-problem-with-monorepos)
  - [Why Repository Boundaries Matter](guide/repository-strategy.md#why-repository-boundaries-matter)

<!-- -->

- [2. Architecture Decisions](guide/architecture-decisions.md)
  - [Client Constraints](guide/architecture-decisions.md#client-constraints)
  - [Understanding The Product](guide/architecture-decisions.md#understanding-the-product)
  - [Technology Selection Principles](guide/architecture-decisions.md#technology-selection-principles)
    - [1. Team Familiarity](guide/architecture-decisions.md#1-team-familiarity)
    - [2. Community Ecosystem](guide/architecture-decisions.md#2-community-ecosystem)
    - [3. Opinionated Structure](guide/architecture-decisions.md#3-opinionated-structure)
    - [4. Stability Over Hype](guide/architecture-decisions.md#4-stability-over-hype)

<!-- -->

- [3. Development Workflow](guide/development-workflow.md)
  - [Task Management](guide/development-workflow.md#task-management)
  - [Git Flow](guide/development-workflow.md#git-flow)
    - [Branch Naming Convention](guide/development-workflow.md#branch-naming-convention)
    - [Commit Conventions](guide/development-workflow.md#commit-conventions)
  - [Feature Workflow](guide/development-workflow.md#feature-workflow)
  - [Bug Fixing Workflow](guide/development-workflow.md#bug-fixing-workflow)
  - [Code Review](guide/development-workflow.md#code-review)
  - [Squash Merge Strategy](guide/development-workflow.md#squash-merge-strategy)
  - [Squash Merge Workflow](guide/development-workflow.md#squash-merge-workflow)
  - [Why this matters](guide/development-workflow.md#why-this-matters)

<!-- -->

- [4. AI-Assisted Development](guide/ai-development.md)
  - [Quality Gates First](guide/ai-development.md#quality-gates-first)
  - [Architecture Before Generation](guide/ai-development.md#architecture-before-generation)
  - [Workflow](guide/ai-development.md#workflow)
    - [Context belongs to the repository](guide/ai-development.md#context-belongs-to-the-repository)
    - [What goes into AGENTS.md](guide/ai-development.md#what-goes-into-agentsmd)
    - [The docs/ folder](guide/ai-development.md#the-docs-folder)
    - [Tune your harness](guide/ai-development.md#tune-your-harness)
    - [Superpowers](guide/ai-development.md#superpowers)
  - [Pre-Hooks](guide/ai-development.md#pre-hooks)
  - [Task Decomposition](guide/ai-development.md#task-decomposition)
    - [1. State the task at a high level](guide/ai-development.md#1-state-the-task-at-a-high-level)
    - [2. Let the agent write the plan](guide/ai-development.md#2-let-the-agent-write-the-plan)
    - [3. Answer the questions](guide/ai-development.md#3-answer-the-questions)
    - [4. Validate and approve](guide/ai-development.md#4-validate-and-approve)
    - [5. Close with conclusions](guide/ai-development.md#5-close-with-conclusions)
  - [Legacy Projects](guide/ai-development.md#legacy-projects)
  - [Common AI Problems](guide/ai-development.md#common-ai-problems)
  - [Cost Optimization](guide/ai-development.md#cost-optimization)
  - [Quality Control](guide/ai-development.md#quality-control)
    - [Commit Frequently](guide/ai-development.md#commit-frequently)
    - [Validate Edge Cases](guide/ai-development.md#validate-edge-cases)
    - [Mandatory Code Review](guide/ai-development.md#mandatory-code-review)
    - [Never Trust AI Blindly](guide/ai-development.md#never-trust-ai-blindly)
  - [Recommended Workflow](guide/ai-development.md#recommended-workflow)

<!-- -->

- [5. Code Quality](guide/code-quality.md)
  - [Layer 1. Code Formatting And Consistency](guide/code-quality.md#layer-1-code-formatting-and-consistency)
  - [Layer 2. Static Analysis With ESLint](guide/code-quality.md#layer-2-static-analysis-with-eslint)
  - [Layer 3. Pre-commit Protection](guide/code-quality.md#layer-3-pre-commit-protection)
  - [Layer 4. Commitlint Configuration](guide/code-quality.md#layer-4-commitlint-configuration)
  - [Layer 5. Continuous Integration Checks](guide/code-quality.md#layer-5-continuous-integration-checks)
  - [Layer 6. Dependency Locking](guide/code-quality.md#layer-6-dependency-locking)

<!-- -->

- [6. Documentation](guide/documentation.md)
  - [Recommended Documentation Structure](guide/documentation.md#recommended-documentation-structure)
    - [README.md](guide/documentation.md#readmemd)
    - [AGENTS.md, CLAUDE.md, docs/ and guide/](guide/documentation.md#agentsmd-claudemd-docs-and-guide)
    - [Swagger / OpenAPI](guide/documentation.md#swagger--openapi) (committed contract: [docs/openapi.json](docs/openapi.json))
  - [Additional Useful Documents](guide/documentation.md#additional-useful-documents)
    - [CHANGELOG.md](guide/documentation.md#changelogmd)
    - [Incident Log](guide/documentation.md#incident-log)
    - [Feature Change Log](guide/documentation.md#feature-change-log)
    - [Roadmap](guide/documentation.md#roadmap)

<!-- -->

- [7. Configuration Management](guide/configuration-management.md)
  - [Environment Configuration Strategy](guide/configuration-management.md#environment-configuration-strategy)
  - [Test Environment Overrides](guide/configuration-management.md#test-environment-overrides)
  - [Secret Management](guide/configuration-management.md#secret-management)
  - [NestJS Configuration Setup](guide/configuration-management.md#nestjs-configuration-setup)
  - [Structured Configuration Modules](guide/configuration-management.md#structured-configuration-modules)
  - [Accessing Configuration](guide/configuration-management.md#accessing-configuration)
  - [Why This Approach Works Well](guide/configuration-management.md#why-this-approach-works-well)
  - [Variable Reference and Production Values](guide/configuration-management.md#variable-reference-and-production-values)
  - [Database TLS](guide/configuration-management.md#database-tls)
  - [Redis TLS and AUTH](guide/configuration-management.md#redis-tls-and-auth)

<!-- -->

- [8. Database Management](guide/database-management.md)
  - [Database Scripts](guide/database-management.md#database-scripts)
  - [Database Manager in Docker](guide/database-management.md#database-manager-in-docker)
  - [Why Not a Separate Database Service?](guide/database-management.md#why-not-a-separate-database-service)
  - [Working with Migrations](guide/database-management.md#working-with-migrations)
    - [Running Migrations in CI/CD](guide/database-management.md#running-migrations-in-cicd)
  - [Seeds](guide/database-management.md#seeds)
  - [Slow Query Metrics (pg_stat_statements)](guide/database-management.md#slow-query-metrics-pg_stat_statements)

<!-- -->

- [9. Project Structure](guide/project-structure.md)
  - [API Layer](guide/project-structure.md#api-layer)
    - [Thin Controllers](guide/project-structure.md#thin-controllers)
  - [Data Validation and Sanitization](guide/project-structure.md#data-validation-and-sanitization)
  - [Unified API Responses](guide/project-structure.md#unified-api-responses)

<!-- -->

- [10. Fault Tolerance](guide/fault-tolerance.md)
  - [Fault vs Failure](guide/fault-tolerance.md#fault-vs-failure)
  - [Non-Critical Dependency](guide/fault-tolerance.md#non-critical-dependency)
    - [Fallback Strategies](guide/fault-tolerance.md#fallback-strategies)
      - [Caching Strategy](guide/fault-tolerance.md#caching-strategy)
      - [Throttling Strategy](guide/fault-tolerance.md#throttling-strategy)
  - [Types of Fault Tolerance](guide/fault-tolerance.md#types-of-fault-tolerance)
    - [High Availability](guide/fault-tolerance.md#high-availability)
    - [Graceful Degradation](guide/fault-tolerance.md#graceful-degradation)
  - [In-Flight Requests Handling](guide/fault-tolerance.md#in-flight-requests-handling)
    - [Manual Check](guide/fault-tolerance.md#manual-check)
  - [Critical Dependency](guide/fault-tolerance.md#critical-dependency)

<!-- -->

- [11. Error Handling](guide/error-handling.md)
  - [Types of Errors](guide/error-handling.md#types-of-errors)
    - [Business Logic Errors](guide/error-handling.md#business-logic-errors)
    - [Database Errors](guide/error-handling.md#database-errors)
    - [Infrastructure Errors](guide/error-handling.md#infrastructure-errors)
  - [Custom Errors](guide/error-handling.md#custom-errors)
  - [Global Exception Handling](guide/error-handling.md#global-exception-handling)
  - [User-Friendly Error Responses](guide/error-handling.md#user-friendly-error-responses)
  - [Error Monitoring (Sentry)](guide/error-handling.md#error-monitoring-sentry)
    - [Early initialization](guide/error-handling.md#early-initialization)
    - [One capture point](guide/error-handling.md#one-capture-point)
    - [What is an incident](guide/error-handling.md#what-is-an-incident)
    - [Personal data (GDPR)](guide/error-handling.md#personal-data-gdpr)
    - [Trace ID](guide/error-handling.md#trace-id)
    - [User Context](guide/error-handling.md#user-context)
  - [Logging and Metrics](guide/error-handling.md#logging-and-metrics)

<!-- -->

- [12. Logging & Observability](guide/logging-observability.md)
  - [Application Logging](guide/logging-observability.md#application-logging)
  - [What Should Be Logged](guide/logging-observability.md#what-should-be-logged)
  - [GDPR Considerations](guide/logging-observability.md#gdpr-considerations)
  - [Trace ID](guide/logging-observability.md#trace-id)
  - [Context](guide/logging-observability.md#context)
  - [Distributed Tracing](guide/logging-observability.md#distributed-tracing)
    - [Coexistence with Sentry](guide/logging-observability.md#coexistence-with-sentry)
    - [Context propagation](guide/logging-observability.md#context-propagation)
    - [Sampling and cost](guide/logging-observability.md#sampling-and-cost)
  - [Observability Stack](guide/logging-observability.md#observability-stack)
  - [Running the Stack Locally](guide/logging-observability.md#running-the-stack-locally)
  - [Logging Pipeline](guide/logging-observability.md#logging-pipeline)
  - [Dashboards](guide/logging-observability.md#dashboards)
  - [Metrics with Prometheus](guide/logging-observability.md#metrics-with-prometheus)
  - [Alerting and SLOs](guide/logging-observability.md#alerting-and-slos)
  - [Why Observability Matters](guide/logging-observability.md#why-observability-matters)
  - [Health Checks and Terminus](guide/logging-observability.md#health-checks-and-terminus)
    - [Critical vs Optional Dependencies](guide/logging-observability.md#critical-vs-optional-dependencies)
    - [/health/live (Liveness)](guide/logging-observability.md#healthlive-liveness)
    - [/health (Critical)](guide/logging-observability.md#health-critical)
      - [Readiness](guide/logging-observability.md#readiness)
    - [/health/deps (All)](guide/logging-observability.md#healthdeps-all)
      - [Optional Dependencies Handling](guide/logging-observability.md#optional-dependencies-handling)

<!-- -->

- [13. Testing](guide/testing.md)
  - [Unit Tests](guide/testing.md#unit-tests)
    - [Mocking Dependencies](guide/testing.md#mocking-dependencies)
  - [End-to-End Tests (E2E)](guide/testing.md#end-to-end-tests-e2e)
    - [Test Environment Setup](guide/testing.md#test-environment-setup)
      - ["Could not find a working container runtime strategy"](guide/testing.md#could-not-find-a-working-container-runtime-strategy)
    - [Writing Effective E2E Tests](guide/testing.md#writing-effective-e2e-tests)
  - [Test Specs Design Style](guide/testing.md#test-specs-design-style)
  - [What E2E Covers](guide/testing.md#what-e2e-covers)
  - [Coverage Thresholds](guide/testing.md#coverage-thresholds)
  - [Load Testing](guide/testing.md#load-testing)

<!-- -->

- [14. Performance](guide/performance.md)
  - [Avoid Returning Unnecessary Data](guide/performance.md#avoid-returning-unnecessary-data)
  - [Use Pagination for Collections](guide/performance.md#use-pagination-for-collections)
    - [Pagination semantics](guide/performance.md#pagination-semantics)
    - [Offset vs cursor pagination](guide/performance.md#offset-vs-cursor-pagination)
  - [Use Database Indexes (When Needed)](guide/performance.md#use-database-indexes-when-needed)
  - [Connection Pool and Timeouts](guide/performance.md#connection-pool-and-timeouts)
  - [Response Compression](guide/performance.md#response-compression)
  - [Cache Invalidation Without KEYS](guide/performance.md#cache-invalidation-without-keys)

<!-- -->

- [15. Security](guide/security.md)
  - [Authentication and Authorization](guide/security.md#authentication-and-authorization)
    - [Resource Ownership](guide/security.md#resource-ownership)
  - [Request Validation](guide/security.md#request-validation)
  - [Response Data Sanitization](guide/security.md#response-data-sanitization)
  - [Security Headers](guide/security.md#security-headers)
  - [CORS Configuration](guide/security.md#cors-configuration)
  - [Rate Limiting](guide/security.md#rate-limiting)
    - [Behind ALB: `trust proxy`](guide/security.md#behind-alb-trust-proxy)
    - [Tracker](guide/security.md#tracker)
    - [Exempt routes](guide/security.md#exempt-routes)
    - [Internal-only metrics](guide/security.md#internal-only-metrics)
    - [Disabling](guide/security.md#disabling)
  - [File Upload Security](guide/security.md#file-upload-security)

<!-- -->

- [16. Release Management](guide/release-management.md)
  - [Release Strategy](guide/release-management.md#release-strategy)
  - [Creating a Release](guide/release-management.md#creating-a-release)
    - [Release Automation](guide/release-management.md#release-automation)
      - [Versioning](guide/release-management.md#versioning)
        - [MAJOR](guide/release-management.md#major)
        - [MINOR](guide/release-management.md#minor)
        - [PATCH](guide/release-management.md#patch)
  - [Continuous Integration (CI)](guide/release-management.md#continuous-integration-ci)
    - [Linting](guide/release-management.md#linting)
    - [Unit Tests](guide/release-management.md#unit-tests)
    - [End-to-End Tests](guide/release-management.md#end-to-end-tests)
    - [Build](guide/release-management.md#build)
    - [Optional Quality Gates](guide/release-management.md#optional-quality-gates)
  - [Continuous Deployment (CD)](guide/release-management.md#continuous-deployment-cd)
    - [GitHub Variables](guide/release-management.md#github-variables)
    - [Database Migration Step](guide/release-management.md#database-migration-step)
      - [Important Note About Migrations](guide/release-management.md#important-note-about-migrations)
    - [Revision Cleanup](guide/release-management.md#revision-cleanup)
  - [Rollback Strategy](guide/release-management.md#rollback-strategy)
    - [Step 1 - Show Available Revisions](guide/release-management.md#step-1---show-available-revisions)
    - [Step 2 - Rollback](guide/release-management.md#step-2---rollback)
  - [Debugging in Production](guide/release-management.md#debugging-in-production)

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

- Identity provider and password management: the API verifies signed tokens and ships a login stub, see [Authentication and Authorization](guide/security.md#authentication-and-authorization)
- Cursor pagination: list endpoints use offset pagination with `count(*)`, which is enough for the Todo scale, see [Performance](guide/performance.md#offset-vs-cursor-pagination)

# Contributing

We welcome any kind of contribution, please read the guidelines:

[CONTRIBUTING](CONTRIBUTING.md)

# The MIT License

[LICENSE](LICENSE)
