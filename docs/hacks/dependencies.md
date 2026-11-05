# Dependency hacks

## Unit tests run Jest with `--experimental-vm-modules`

- **What:** `test`, `test:cov` and `test:watch` set `NODE_OPTIONS="$NODE_OPTIONS --experimental-vm-modules"`, and `test:debug` passes the flag to `node`, like the e2e scripts already did.
- **Where:** `package.json` (`scripts`).
- **Why:** NestJS 12 ships as ES modules only (`"type": "module"`) while the app compiles to CommonJS. Node 24 loads them with `require()` at runtime, but Jest's module loader does that only with the VM modules flag; without it every suite that imports `@nestjs/*` fails with "Must use import to load ES Module".
- **If cleaned up:** removing the flag breaks almost every unit suite. Moving the app to ESM output would make it unnecessary.

## Own Redis storage for the throttler

- **What:** `ThrottlerRedisStorage` implements the `ThrottlerStorage` contract of `@nestjs/throttler` with one Lua script, instead of using `@nest-lab/throttler-storage-redis`.
- **Where:** `src/modules/redis-manager/storages/throttler-redis.storage.ts`; the in-memory fallback is `throttler.storage.ts` in the same folder.
- **Why:** the package still declares NestJS 11 peers and blocked the NestJS 12 upgrade. The script is the package's own (MIT, credited in the file), so the Redis keys and behaviour did not change.
- **If cleaned up:** going back to the package needs a release that accepts NestJS 12 peers. The fallback must keep the same contract as the script: times in milliseconds in, remaining seconds out, or `Retry-After` breaks when Redis is down.

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
