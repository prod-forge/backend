# Tooling hacks

## No DATABASE_HOST check in prisma.config.ts

- **What:** `prisma.config.ts` builds the URL with `getDatabaseUrl('require')` without `assertDatabaseHost()`; the app (`databaseConfig`) and the seed client (`database-manager/prisma.ts`) do check it.
- **Where:** `prisma.config.ts`, `database-manager/generate-url.ts`.
- **Why:** `prisma generate` loads the config too, and the Docker build runs it without any env file (`.env.common` is not copied into the image), so a check there would fail the image build. `migrate deploy` without a host still fails, with a connection error to `undefined`.
- **If cleaned up:** adding the check to `prisma.config.ts` or inside `getDatabaseUrl` breaks `RUN npm run db:generate` in the Dockerfile.

## console output in scripts

- **What:** `no-console` disabled on specific lines.
- **Where:** `scripts/export-openapi.ts`, `scripts/issue-token.ts`, `test/openapi.e2e-spec.ts`.
- **Why:** the scripts are CLI tools; the e2e test prints the `npm run openapi:export` hint next to the jest diff (comment in the file). Config validation does not print: `validateConfig` throws an `Error` that lists each failed variable on its own line.
- **If cleaned up:** removing the disables fails lint.

## Underscore file names

- **What:** `@check-file/filename-naming-convention` disabled for the whole file.
- **Where:** `src/error-handler/errors/_base.error.ts`, `src/modules/redis-manager/clients/_base.client.ts`.
- **Why:** the leading underscore marks the base class of the folder and sorts it first (inference: no comment in the files).
- **If cleaned up:** renaming the files changes every import of the base classes.

## pg option names in camelCase code

- **What:** `camelcase` disabled where the `pg` pool option `statement_timeout` is set.
- **Where:** `src/modules/prisma/prisma.service.ts`, `src/modules/prisma/prisma.service.spec.ts` (`-- pg option name`).
- **Why:** the option name is defined by `pg`.
- **If cleaned up:** a camelCase key is ignored by `pg` and the statement timeout is lost.

## Default exports in the e2e global setup

- **What:** `@import-lite/no-default-export` disabled.
- **Where:** `test/setup/setup.global.ts`, `test/setup/teardown.global.ts`.
- **Why:** Jest loads `globalSetup` and `globalTeardown` from a default export; everything else uses named exports.
- **If cleaned up:** Jest cannot find the setup function and e2e tests do not start.

## Status code as an enum value

- **What:** `@typescript-eslint/no-unsafe-enum-assignment` disabled in `HttpStatusError`.
- **Where:** `src/error-handler/errors/common.errors.ts` (comment in the file).
- **Why:** the status comes from `HttpException.getStatus()`, a plain number.

## Knip exceptions

- **What:** Knip ignores `src/**/*.enum.ts` and `src/error-handler/errors/common.errors.ts`, and the `k6` binary and dependency.
- **Where:** `knip.json`.
- **Why:** `k6` is a system binary run by `npm run test:load`, not an npm package. For the ignored files the reason is not documented (inference: they export members kept for completeness, such as error classes not thrown yet).
- **If cleaned up:** `npm run knip` (pre-push and CI) fails.
