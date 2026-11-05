# Dependency hacks

## multer override until NestJS 12

- **What:** `overrides` pins `multer` 2.5.0 under `@nestjs/platform-express`.
- **Where:** `package.json` (`overrides`); `guide/code-quality.md` (the paragraph after "For dependency updates"); `roadmap.md` ("NestJS 12").
- **Why:** `npm audit` flagged the `multer` version that `@nestjs/platform-express` 11 depends on; the override pins the patched version for that one parent. NestJS 12 is blocked because `@nest-lab/throttler-storage-redis` still declares NestJS 11 peers (`roadmap.md`).
- **If cleaned up:** removing the override before the NestJS 12 upgrade brings the flagged version back, and the CI `npm audit --omit=dev --audit-level=high` step can fail. After the upgrade, the override should be removed in the same change.

## OpenTelemetry pinned to the line Sentry 10 accepts

- **What:** `@opentelemetry/core` is 2.12.0 and `@opentelemetry/sdk-node` / `exporter-trace-otlp-http` are 0.223.0, although newer lines exist; `@sentry/opentelemetry` has the same version as `@sentry/node` (10.78.0).
- **Where:** `package.json` (`dependencies`); `guide/logging-observability.md`, "Coexistence with Sentry".
- **Why:** Sentry and the app share one TracerProvider (`src/tracing.ts`, `src/instrument.ts`). Sentry 10 accepts `core` 2.x; the 0.300 SDK line moves to `core` 3, and mixing majors breaks the shared context.
- **If cleaned up:** a Dependabot or `ncu -u` bump of only the OpenTelemetry packages compiles but loses or splits spans. `.github/dependabot.yml` has no ignore rule for this, so every such pull request needs a manual check (inference: not verified against an actual Dependabot pull request).

## npm removed from the production image

- **What:** the production stage deletes `/usr/local/lib/node_modules/npm`, `npm` and `npx` after `npm ci --omit=dev --ignore-scripts`.
- **Where:** `Dockerfile` (production stage, with a comment); `ecs/migration-task.json` (`"command": ["node_modules/.bin/prisma", "migrate", "deploy"]`); `CMD ["node", "dist/src/main.js"]`.
- **Why:** nothing runs through npm at runtime, and the npm bundled with the base image carries its own dependency tree that image scans keep flagging (the Trivy step in CI fails on HIGH/CRITICAL).
- **If cleaned up:** keeping npm brings the scan findings back. Changing the container or migration command to `npm run ...` fails at runtime, because there is no npm in the image.
