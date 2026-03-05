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

| Repository | Description |
|-------------|-------------|
| Backend | Production-ready backend application |
| Infrastructure | Terraform infrastructure for AWS |

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

