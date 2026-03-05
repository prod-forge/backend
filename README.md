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

- Backend → (link)
- Infrastructure → (link)

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
