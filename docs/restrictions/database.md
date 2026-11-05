# Database

## Migration files are written by the owner

- **Rule:** an agent does not create or edit files in `database-manager/migrations/`. A schema change proposes the SQL in the plan or the pull request; the owner lands the migration file.
- **Reason:** migration files are the history Prisma replays; a hand-edited or regenerated file corrupts it (`guide/ai-development.md`, "Pre-Hooks").
- **Where:** `.claude/settings.json` — the first `Edit|Write` hook denies any path matching `database-manager/migrations`.
- **Consequence:** `database-manager/schema.prisma` and the migrations have drifted on the `Todo` indexes; the pending migration is GitHub issue #19 ([data-schema.md](../architecture/data-schema.md), "Indexes").

## Forward-only migrations

- **Rule:** no down migrations; a schema change must not break the version that is still running.
- **Reason:** CD runs migrations before the new task definition is deployed, and a rollback restores an older task revision without touching the schema (`guide/release-management.md`, "Important Note About Migrations").
- **Where:** `.github/workflows/cd.yml` ("Run Migrations" job before "Deploy ECS"), `.github/workflows/rollback.yml`.

## The Prisma client is generated

- **Rule:** never edit `database-manager/generated/`; regenerate it with `npm run db:generate`.
- **Where:** `.gitignore`; `cspell.json` and `nestjs-doctor.config.json` ignore it.
