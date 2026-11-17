**Status:** 📝 draft · **Version:** — (CI, load script and docs, no release) · **Date:** 2026-11-17 · **Modules:** CI, load, docs, guide (+ terraform guide for the drill)

# 004 — Release safety: prove what is already built

## Goal

Migrations in CD, rollback, graceful shutdown and readiness, backups and a restore procedure already exist. What is
missing is proof: nothing checks that a migration keeps the previous release working, nobody has measured a rolling
deploy under traffic, and the restore procedure has never been run. This plan adds those checks and records the
results. Design: [00-design.md](./00-design.md).

## Plans

1. [01-migration-safety](./01-migration-safety/readme.md) — CI checks that a migration does not break the running
   release, and a runbook for a migration that fails half-way.
2. [02-deploy-under-load](./02-deploy-under-load/readme.md) — a k6 scenario run during a rolling deploy; zero failed
   requests is the bar.
3. [03-restore-drill](./03-restore-drill/readme.md) — the first real run of the restore drill against the terraform
   stack, with times recorded.

## Conclusions

_Written when the plan is done._
