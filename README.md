<p align="center">
  <img alt="Logo" src="https://github.com/prod-forge/backend/blob/main/assets/prod-forge-logo.png" width="264px" height="243px">
</p>

AI made writing backend code easy but running it in production is still hard.

**Prod Forge** is an open-source reference that focuses on everything beyond the code:
CI/CD, infrastructure, observability, deployment, migrations, and rollback.

A simple Todo API, built as if it were a real production system.

---

## Project structure

| Repository                                                | Description                 |
| --------------------------------------------------------- | --------------------------- |
| [Backend](https://github.com/prod-forge/backend)          | NestJS API - the main guide |
| [Infrastructure](https://github.com/prod-forge/terraform) | Terraform on AWS            |

## Stack

<p align="center">
  <img alt="Architecture" src="https://github.com/prod-forge/backend/blob/main/assets/architecture_diagram.png">
</p>

| Layer          | Tools                                          |
| -------------- | ---------------------------------------------- |
| Backend        | NestJS · Prisma · PostgreSQL · Redis · Docker  |
| Infrastructure | AWS · ECR · ECS · RDS · ElasticCache           |
| Observability  | Prometheus · Grafana · Loki · Promtail         |
| Quality        | ESLint · Prettier · Husky · Commitlint · CI/CD |

# Table of contents

- [1. Repository Strategy](https://github.com/prod-forge/backend/blob/main/docs/repository-strategy.md)
  - [When Monorepos Work Well](https://github.com/prod-forge/backend/blob/main/docs/repository-strategy.md#when-monorepos-work-well)
  - [A Real-World Problem With Monorepos](https://github.com/prod-forge/backend/blob/main/docs/repository-strategy.md#a-real-world-problem-with-monorepos)
  - [Why Repository Boundaries Matter](https://github.com/prod-forge/backend/blob/main/docs/repository-strategy.md#why-repository-boundaries-matter)

<!-- -->

- [2. Architecture Decisions](https://github.com/prod-forge/backend/blob/main/docs/architecture-decisions.md)
  - [Client Constraints](https://github.com/prod-forge/backend/blob/main/docs/architecture-decisions.md#client-constraints)
  - [Understanding The Product](https://github.com/prod-forge/backend/blob/main/docs/architecture-decisions.md#understanding-the-product)
  - [Technology Selection Principles](https://github.com/prod-forge/backend/blob/main/docs/architecture-decisions.md#technology-selection-principles)
    - [1. Team Familiarity](https://github.com/prod-forge/backend/blob/main/docs/architecture-decisions.md#1-team-familiarity)
    - [2. Community Ecosystem](https://github.com/prod-forge/backend/blob/main/docs/architecture-decisions.md#2-community-ecosystem)
    - [3. Opinionated Structure](https://github.com/prod-forge/backend/blob/main/docs/architecture-decisions.md#3-opinionated-structure)
    - [4. Stability Over Hype](https://github.com/prod-forge/backend/blob/main/docs/architecture-decisions.md#4-stability-over-hype)

<!-- -->

- [3. Development Workflow](https://github.com/prod-forge/backend/blob/main/docs/development-workflow.md)
  - [Task Management](https://github.com/prod-forge/backend/blob/main/docs/development-workflow.md#task-management)
  - [Git Flow](https://github.com/prod-forge/backend/blob/main/docs/development-workflow.md#git-flow)
    - [Branch Naming Convention](https://github.com/prod-forge/backend/blob/main/docs/development-workflow.md#branch-naming-convention)
    - [Commit Conventions](https://github.com/prod-forge/backend/blob/main/docs/development-workflow.md#commit-conventions)
  - [Feature Workflow](https://github.com/prod-forge/backend/blob/main/docs/development-workflow.md#feature-workflow)
  - [Bug Fixing Workflow](https://github.com/prod-forge/backend/blob/main/docs/development-workflow.md#bug-fixing-workflow)
  - [Code Review](https://github.com/prod-forge/backend/blob/main/docs/development-workflow.md#code-review)
  - [Squash Merge Strategy](https://github.com/prod-forge/backend/blob/main/docs/development-workflow.md#squash-merge-strategy)
  - [Squash Merge Workflow](https://github.com/prod-forge/backend/blob/main/docs/development-workflow.md#squash-merge-workflow)

<!-- -->

- [4. Code Quality](https://github.com/prod-forge/backend/blob/main/docs/code-quality.md)
  - [Layer 1. Code Formatting And Consistency](https://github.com/prod-forge/backend/blob/main/docs/code-quality.md#layer-1-code-formatting-and-consistency)
  - [Layer 2. Static Analysis With ESLint](https://github.com/prod-forge/backend/blob/main/docs/code-quality.md#layer-2-static-analysis-with-eslint)
  - [Layer 3. Pre-commit Protection](https://github.com/prod-forge/backend/blob/main/docs/code-quality.md#layer-3-pre-commit-protection)
  - [Layer 4. Commitlint Configuration](https://github.com/prod-forge/backend/blob/main/docs/code-quality.md#layer-4-commitlint-configuration)
  - [Layer 5. Continuous Integration Checks](https://github.com/prod-forge/backend/blob/main/docs/code-quality.md#layer-5-continuous-integration-checks)

<!-- -->

- [5. Documentation](https://github.com/prod-forge/backend/blob/main/docs/documentation.md)
  - [Recommended Documentation Structure](https://github.com/prod-forge/backend/blob/main/docs/documentation.md#recommended-documentation-structure)
    - [README.md](https://github.com/prod-forge/backend/blob/main/docs/documentation.md#readmemd)
    - [Swagger / OpenAPI](https://github.com/prod-forge/backend/blob/main/docs/documentation.md#swagger--openapi)
  - [Additional Useful Documents](https://github.com/prod-forge/backend/blob/main/docs/documentation.md#additional-useful-documents)
    - [CHANGELOG.md](https://github.com/prod-forge/backend/blob/main/docs/documentation.md#changelogmd)
    - [Incident Log](https://github.com/prod-forge/backend/blob/main/docs/documentation.md#incident-log)
    - [Feature Change Log](https://github.com/prod-forge/backend/blob/main/docs/documentation.md#feature-change-log)
    - [Roadmap](https://github.com/prod-forge/backend/blob/main/docs/documentation.md#roadmap)

<!-- -->

- [6. Configuration Management](https://github.com/prod-forge/backend/blob/main/docs/configuration-management.md)
  - [Environment Configuration Strategy](https://github.com/prod-forge/backend/blob/main/docs/configuration-management.md#environment-configuration-strategy)
  - [Secret Management](https://github.com/prod-forge/backend/blob/main/docs/configuration-management.md#secret-management)
  - [NestJS Configuration Setup](https://github.com/prod-forge/backend/blob/main/docs/configuration-management.md#nestjs-configuration-setup)
  - [Structured Configuration Modules](https://github.com/prod-forge/backend/blob/main/docs/configuration-management.md#structured-configuration-modules)
  - [Accessing Configuration](https://github.com/prod-forge/backend/blob/main/docs/configuration-management.md#accessing-configuration)
  - [Why This Approach Works Well](https://github.com/prod-forge/backend/blob/main/docs/configuration-management.md#why-this-approach-works-well)

<!-- -->

- [7. Database Management](https://github.com/prod-forge/backend/blob/main/docs/database-management.md)
  - [Database Scripts](https://github.com/prod-forge/backend/blob/main/docs/database-management.md#database-scripts)
  - [Database Manager in Docker](https://github.com/prod-forge/backend/blob/main/docs/database-management.md#database-manager-in-docker)
  - [Why Not a Separate Database Service?](https://github.com/prod-forge/backend/blob/main/docs/database-management.md#why-not-a-separate-database-service)
  - [Working with Migrations](https://github.com/prod-forge/backend/blob/main/docs/database-management.md#working-with-migrations)
    - [Running Migrations in CI/CD](https://github.com/prod-forge/backend/blob/main/docs/database-management.md#running-migrations-in-cicd)

<!-- -->

- [8. Project Structure](https://github.com/prod-forge/backend/blob/main/docs/project-structure.md)
  - [API Layer](https://github.com/prod-forge/backend/blob/main/docs/project-structure.md#api-layer)
    - [Thin Controllers](https://github.com/prod-forge/backend/blob/main/docs/project-structure.md#thin-controllers)
  - [Data Validation and Sanitization](https://github.com/prod-forge/backend/blob/main/docs/project-structure.md#data-validation-and-sanitization)
  - [Unified API Responses](https://github.com/prod-forge/backend/blob/main/docs/project-structure.md#unified-api-responses)

<!-- -->

- [9. Fault Tolerance](https://github.com/prod-forge/backend/blob/main/docs/fault-tolerance.md)
  - [Non-Critical Dependency](https://github.com/prod-forge/backend/blob/main/docs/fault-tolerance.md#non-critical-dependency)
    - [Fallback Strategies](https://github.com/prod-forge/backend/blob/main/docs/fault-tolerance.md#fallback-strategies)
      - [Caching Strategy](https://github.com/prod-forge/backend/blob/main/docs/fault-tolerance.md#caching-strategy)
      - [Throttling Strategy](https://github.com/prod-forge/backend/blob/main/docs/fault-tolerance.md#throttling-strategy)
  - [Graceful Degradation](https://github.com/prod-forge/backend/blob/main/docs/fault-tolerance.md#graceful-degradation)

<!-- -->

- [10. Error Handling](https://github.com/prod-forge/backend/blob/main/docs/error-handling.md)
  - [Types of Errors](https://github.com/prod-forge/backend/blob/main/docs/error-handling.md#types-of-errors)
    - [Business Logic Errors](https://github.com/prod-forge/backend/blob/main/docs/error-handling.md#business-logic-errors)
    - [Database Errors](https://github.com/prod-forge/backend/blob/main/docs/error-handling.md#database-errors)
    - [Infrastructure Errors](https://github.com/prod-forge/backend/blob/main/docs/error-handling.md#infrastructure-errors)
  - [Custom Errors](https://github.com/prod-forge/backend/blob/main/docs/error-handling.md#custom-errors)
  - [Global Exception Handling](https://github.com/prod-forge/backend/blob/main/docs/error-handling.md#global-exception-handling)
  - [User-Friendly Error Responses](https://github.com/prod-forge/backend/blob/main/docs/error-handling.md#user-friendly-error-responses)
  - [Error Monitoring (Sentry)](https://github.com/prod-forge/backend/blob/main/docs/error-handling.md#error-monitoring-sentry)
    - [Correlation ID](https://github.com/prod-forge/backend/blob/main/docs/error-handling.md#correlation-id)
    - [User Context](https://github.com/prod-forge/backend/blob/main/docs/error-handling.md#user-context)
  - [Logging and Metrics](https://github.com/prod-forge/backend/blob/main/docs/error-handling.md#logging-and-metrics)

<!-- -->

- [11. Logging & Observability](https://github.com/prod-forge/backend/blob/main/docs/logging-observability.md)
  - [Application Logging](https://github.com/prod-forge/backend/blob/main/docs/logging-observability.md#application-logging)
  - [What Should Be Logged](https://github.com/prod-forge/backend/blob/main/docs/logging-observability.md#what-should-be-logged)
  - [GDPR Considerations](https://github.com/prod-forge/backend/blob/main/docs/logging-observability.md#gdpr-considerations)
  - [Correlation ID](https://github.com/prod-forge/backend/blob/main/docs/logging-observability.md#correlation-id)
  - [Context](https://github.com/prod-forge/backend/blob/main/docs/logging-observability.md#context)
  - [Observability Stack](https://github.com/prod-forge/backend/blob/main/docs/logging-observability.md#observability-stack)
  - [Logging Pipeline](https://github.com/prod-forge/backend/blob/main/docs/logging-observability.md#logging-pipeline)
  - [Dashboards](https://github.com/prod-forge/backend/blob/main/docs/logging-observability.md#dashboards)
  - [Metrics with Prometheus](https://github.com/prod-forge/backend/blob/main/docs/logging-observability.md#metrics-with-prometheus)
  - [Why Observability Matters](https://github.com/prod-forge/backend/blob/main/docs/logging-observability.md#why-observability-matters)

<!-- -->

- [12. Testing](https://github.com/prod-forge/backend/blob/main/docs/testing.md)
  - [Unit Tests](https://github.com/prod-forge/backend/blob/main/docs/testing.md#unit-tests)
    - [Mocking Dependencies](https://github.com/prod-forge/backend/blob/main/docs/testing.md#mocking-dependencies)
  - [End-to-End Tests (E2E)](https://github.com/prod-forge/backend/blob/main/docs/testing.md#end-to-end-tests-e2e)
    - [Test Environment Setup](https://github.com/prod-forge/backend/blob/main/docs/testing.md#test-environment-setup)
    - [Writing Effective E2E Tests](https://github.com/prod-forge/backend/blob/main/docs/testing.md#writing-effective-e2e-tests)
  - [Test Specs Design Style](https://github.com/prod-forge/backend/blob/main/docs/testing.md#test-specs-design-style)

<!-- -->

- [13. Performance](https://github.com/prod-forge/backend/blob/main/docs/performance.md)
  - [Avoid Returning Unnecessary Data](https://github.com/prod-forge/backend/blob/main/docs/performance.md#avoid-returning-unnecessary-data)
  - [Use Pagination for Collections](https://github.com/prod-forge/backend/blob/main/docs/performance.md#use-pagination-for-collections)
  - [Use Database Indexes (When Needed)](https://github.com/prod-forge/backend/blob/main/docs/performance.md#use-database-indexes-when-needed)
  - [Response Compression](https://github.com/prod-forge/backend/blob/main/docs/performance.md#response-compression)

<!-- -->

- [14. Security](https://github.com/prod-forge/backend/blob/main/docs/security.md)
  - [Request Validation](https://github.com/prod-forge/backend/blob/main/docs/security.md#request-validation)
  - [Response Data Sanitization](https://github.com/prod-forge/backend/blob/main/docs/security.md#response-data-sanitization)
  - [Security Headers](https://github.com/prod-forge/backend/blob/main/docs/security.md#security-headers)
  - [CORS Configuration](https://github.com/prod-forge/backend/blob/main/docs/security.md#cors-configuration)
  - [Rate Limiting](https://github.com/prod-forge/backend/blob/main/docs/security.md#rate-limiting)
  - [File Upload Security](https://github.com/prod-forge/backend/blob/main/docs/security.md#file-upload-security)

<!-- -->

- [15. Release Management](https://github.com/prod-forge/backend/blob/main/docs/release-management.md)
  - [Release Strategy](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#release-strategy)
  - [Creating a Release](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#creating-a-release)
    - [Release Automation](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#release-automation)
      - [Versioning](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#versioning)
        - [MAJOR](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#major)
        - [MINOR](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#minor)
        - [PATCH](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#patch)
  - [Continuous Integration (CI)](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#continuous-integration-ci)
    - [Linting](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#linting)
    - [Unit Tests](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#unit-tests)
    - [End-to-End Tests](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#end-to-end-tests)
    - [Build](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#build)
    - [Optional Quality Gates](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#optional-quality-gates)
  - [Continuous Deployment (CD)](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#continuous-deployment-cd)
    - [Database Migration Step](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#database-migration-step)
      - [Important Note About Migrations](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#important-note-about-migrations)
    - [Revision Cleanup](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#revision-cleanup)
  - [Rollback Strategy](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#rollback-strategy)
    - [Step 1 - Show Available Revisions](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#step-1---show-available-revisions)
    - [Step 2 - Rollback](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#step-2---rollback)
  - [Debugging in Production](https://github.com/prod-forge/backend/blob/main/docs/release-management.md#debugging-in-production)

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

This project is actively evolving.
Planned additions include:

- Frontend repository with the same level of production treatment
- Mobile App repository with the same level of production treatment
- Kubernetes-based infrastructure as an alternative to ECS

If there is something missing that you would find valuable, open an issue or start a discussion.

## A final thought

The best time to set up these practices is at the beginning of a project.

The second best time is now.

A system without observability is a system you cannot debug under pressure. A team without a defined workflow is a team
that slows down as it grows. A deployment without a rollback plan is a deployment that will eventually cause an incident
with no recovery path.

None of these things are difficult to set up. They are just easy to skip.
This project exists as a reminder not to skip them.

# Contributing

We welcome any kind of contribution, please read the guidelines:

[CONTRIBUTING](https://github.com/prod-forge/backend/blob/main/CONTRIBUTING.md)

# The MIT License

[LICENSE](https://github.com/prod-forge/backend/blob/main/LICENSE.md)
