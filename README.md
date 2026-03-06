# Prod Forge

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
