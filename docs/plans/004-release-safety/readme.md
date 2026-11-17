**Status:** 📝 draft · **Version:** — (CI, load script and docs, no release) · **Date:** 2026-11-17 · **Modules:** scripts, CI, load, docs, guide

# 004 — Release safety: prove what is already built

## Goal

Migrations in CD, rollback, graceful shutdown and readiness already exist. What is missing is proof: nothing checks
that a migration keeps the running release working, and the shutdown chain has never been measured under traffic.
This plan adds cheap checks that run in CI or locally. Nothing is deployed and no AWS resources are created.
Design: [00-design.md](./00-design.md).

## Plans

1. [01-migration-safety](./01-migration-safety/readme.md) — a CI check against destructive migrations, and a runbook
   for a migration that fails half-way.
2. [02-shutdown-under-load](./02-shutdown-under-load/readme.md) — a local k6 run that stops the app under traffic;
   in-flight requests must finish.

## Conclusions

_Written when the plan is done._
