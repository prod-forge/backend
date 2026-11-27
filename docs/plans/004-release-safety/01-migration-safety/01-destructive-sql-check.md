**Status:** ⏸ hold · **Version:** — (CI only) · **Date:** 2026-11-17 · **Modules:** scripts, CI, docs

# 01 — Destructive SQL check

## Files

- `scripts/check-migrations.sh` — takes a base ref (default `origin/main`), lists `migration.sql` files added since
  it, fails on `DROP TABLE`, `DROP COLUMN`, `RENAME`, `ALTER COLUMN ... TYPE`, `SET NOT NULL`, and
  `ADD COLUMN ... NOT NULL` without `DEFAULT`, unless the file has `-- release-safety: allow <statement> (<reason>)`
  for that statement. Prints file, line and the rule.
- `scripts/check-migrations.test.sh` — fixtures in a temp dir, same style as `render-migration-task.test.sh`.
- `.github/workflows/ci.yml`, `cd.yml` — a step in `lint` (both files, kept in sync per
  [restrictions/ci-cd.md](../../../restrictions/ci-cd.md)); `fetch-depth: 0` for the diff.
- `docs/restrictions/database.md` — "Forward-only migrations" gets the check as its "Where".
- `guide/database-management.md` — expand/contract in two releases, and the opt-out comment.

## Tests

Negative first: each pattern fails; `ADD COLUMN ... NOT NULL` without default fails; an opt-out for another statement
does not cover this one. Positive: `CREATE TABLE`, `CREATE INDEX`, `ADD COLUMN` nullable or with default pass; an
opt-out passes; files that already exist on the base ref are not checked (the `init` migration).
