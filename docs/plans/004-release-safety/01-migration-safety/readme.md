**Status:** 📝 draft · **Version:** — (CI and docs, no release) · **Date:** 2026-11-17 · **Modules:** scripts, CI, guide, docs

# 01 — Migration safety

## Steps

1. [01-destructive-sql-check](./01-destructive-sql-check.md) — `scripts/check-migrations.sh` with its test, wired
   into `ci.yml` and `cd.yml`.
2. [02-previous-release-check](./02-previous-release-check.md) — CI job: the latest released image against the pull
   request's schema.
3. [03-failed-migration-runbook](./03-failed-migration-runbook.md) — "Failed migration" in
   `guide/release-management.md`.

## Conclusions

_Written when the plan is done._
