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

## Two tracing modes for Sentry 11

- **What:** with `OTEL_EXPORTER_OTLP_ENDPOINT` the `NodeSDK` owns tracing and sends spans to Tempo and to Sentry's OTLP endpoint, and Sentry is initialised without `tracesSampleRate` but with `openTelemetryIntegration()`; without the endpoint Sentry traces itself with `enableOpenTelemetrySetup: true`.
- **Where:** `src/instrument.ts`, `src/tracing.ts`, `src/modules/sentry/sentry-options.ts`; `guide/logging-observability.md`, "Coexistence with Sentry".
- **Why:** Sentry 11 removed `SentrySpanProcessor`, `SentrySampler` and `SentryContextManager`, so it can no longer share a TracerProvider the app owns. `enableOpenTelemetrySetup` in the second mode keeps `X-Trace-Id` and log trace ids equal to the Sentry trace id, because `traceIdMiddleware` reads the active OpenTelemetry span.
- **If cleaned up:** setting `tracesSampleRate` in the first mode makes Sentry record its own spans next to the OpenTelemetry ones; dropping `enableOpenTelemetrySetup` in the second makes `X-Trace-Id` a random UUID that no Sentry event carries.

## npm removed from the production image

- **What:** the production stage deletes `/usr/local/lib/node_modules/npm`, `npm` and `npx` after `npm ci --omit=dev --ignore-scripts`.
- **Where:** `Dockerfile` (production stage, with a comment); `ecs/migration-task.json` (`"command": ["node_modules/.bin/prisma", "migrate", "deploy"]`); `CMD ["node", "dist/src/main.js"]`.
- **Why:** nothing runs through npm at runtime, and the npm bundled with the base image carries its own dependency tree that image scans keep flagging (the Trivy step in CI fails on HIGH/CRITICAL).
- **If cleaned up:** keeping npm brings the scan findings back. Changing the container or migration command to `npm run ...` fails at runtime, because there is no npm in the image.
