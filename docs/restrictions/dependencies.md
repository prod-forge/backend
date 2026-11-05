# Dependencies

## Exact versions, generated lock file

- **Rule:** dependencies are saved with exact versions; `package-lock.json` is changed only by npm.
- **Reason:** reproducible installs (`guide/code-quality.md`, "Layer 6").
- **Where:** `.npmrc` (`save-exact=true`); `.claude/settings.json` denies Edit and Write on `package-lock.json`.

## Overrides are temporary

- **Rule:** an entry in `overrides` in `package.json` pins one patched transitive dependency under one named parent, and the roadmap tracks the upgrade that removes it. Do not add a global override.
- **Reason:** `npm audit` flagged a transitive dependency the direct dependency had not patched yet (`guide/code-quality.md`).
- **Where:** `package.json` (`overrides`, empty since the NestJS 12 upgrade removed the `multer` pin); `roadmap.md` tracks any new one.

## OpenTelemetry stays on the line Sentry accepts

- **Rule:** upgrade `@sentry/node`, `@sentry/opentelemetry` and the `@opentelemetry/*` packages together; keep `@opentelemetry/core` on the major that `@sentry/node` accepts.
- **Reason:** Sentry 10 and the app share one TracerProvider; mixing OpenTelemetry SDK majors breaks the shared context (`guide/logging-observability.md`, "Coexistence with Sentry").
- **Where:** `package.json` (`@sentry/*` 10.78.0, `@opentelemetry/core` 2.12.0, `@opentelemetry/sdk-node` 0.223.0). See [../hacks/dependencies.md](../hacks/dependencies.md).

## Node version

- **Rule:** Node.js 24 (`engines`: `>=24.15.0`, npm `>=11.0.0`); CI and the image use 24.21.0.
- **Where:** `package.json` (`engines`); `NODE_VERSION: 24.21.0` in `.github/workflows/ci.yml` and `.github/workflows/cd.yml`; `node:24.21.0-alpine` in the `Dockerfile`.
