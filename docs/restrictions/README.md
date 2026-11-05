# Restrictions

Constraints of this project. Each entry gives the rule, the reason and where it is enforced. Read these before writing a plan.

- [ci-cd.md](ci-cd.md) — CI on every pull request, a `v*` tag deploys to AWS.
- [database.md](database.md) — migrations written by the owner and forward-only, generated Prisma client.
- [dependencies.md](dependencies.md) — exact versions, temporary overrides, OpenTelemetry pinned to Sentry.
- [repository.md](repository.md) — English, commit messages, generated and protected files, the OpenAPI contract.
