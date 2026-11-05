# Dependencies

## Exact versions, generated lock file

- **Rule:** dependencies are saved with exact versions; `package-lock.json` is changed only by npm.
- **Reason:** reproducible installs (`guide/code-quality.md`, "Layer 6").
- **Where:** `.npmrc` (`save-exact=true`); `.claude/settings.json` denies Edit and Write on `package-lock.json`.

## Overrides are temporary

- **Rule:** an entry in `overrides` in `package.json` pins one patched transitive dependency under one named parent, and the roadmap tracks the upgrade that removes it. Do not add a global override.
- **Reason:** `npm audit` flagged a transitive dependency the direct dependency had not patched yet (`guide/code-quality.md`).
- **Where:** `package.json` (`overrides`, empty since the NestJS 12 upgrade removed the `multer` pin); `roadmap.md` tracks any new one.

## Sentry and OpenTelemetry are upgraded together

- **Rule:** upgrade `@sentry/node`, `@sentry/profiling-node` and the `@opentelemetry/*` packages in one change, and check both tracing modes (with and without `OTEL_EXPORTER_OTLP_ENDPOINT`) before merging.
- **Reason:** the `@opentelemetry/sdk-node` line pins one `@opentelemetry/api` minor, and `@sentry/node` declares its own `api` range; a partial bump fails to install or splits the trace between Sentry and Tempo (`guide/logging-observability.md`, "Coexistence with Sentry").
- **Where:** `package.json` (`@sentry/*` 11.11.0, `@opentelemetry/api` 1.10.0, `@opentelemetry/core` 3.0.0, `@opentelemetry/sdk-node` 0.300.0). See [../hacks/dependencies.md](../hacks/dependencies.md).

## Node version

- **Rule:** CI and the image run Node.js 26.13.0 (LTS); `engines` keeps `>=24.15.0` (npm `>=11.0.0`), so local machines on Node 24 LTS still install and run the project. Bump the image and both workflows together.
- **Where:** `package.json` (`engines`); `NODE_VERSION: 26.13.0` in `.github/workflows/ci.yml` and `.github/workflows/cd.yml`; `node:26.13.0-alpine` in the `Dockerfile`.
