# Hacks

Every place where the code takes a shortcut or makes a non-obvious decision, and why. Without this list an agent "cleans up" exactly the code that must stay as it is. Before removing an `eslint-disable`, an override, a disabled instrumentation or an odd import order, check here.

- [dependencies.md](dependencies.md) — Jest and ESM-only NestJS, the own throttler storage, two tracing modes for Sentry 11, npm removed from the image.
- [observability.md](observability.md) — `instrument.ts` first, disabled instrumentations, the metrics gate.
- [api.md](api.md) — login without a password, tolerant web log metadata.
- [tooling.md](tooling.md) — lint disables, Knip exceptions, no host check in the Prisma config.

## Format

```markdown
## <Short name>

- **What:** the shortcut or decision.
- **Where:** file path(s).
- **Why:** the reason.
- **If cleaned up:** what breaks when someone "fixes" it.
```
