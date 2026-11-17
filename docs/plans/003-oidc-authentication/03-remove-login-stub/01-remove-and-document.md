**Status:** ✅ approved · **Version:** 2.0.0 · **Date:** 2026-11-17 · **Modules:** api auth, modules/auth, config, docs/openapi.json, docs, guide

# 01 — Remove and document

## Files

- Delete `src/api/auth/` and its registration, `AuthService.issueToken`, `UsersService.issueTokenByEmail`,
  `JWT_SECRET`, `JWT_TTL`, `@nestjs/jwt`.
- `docs/openapi.json` — `npm run openapi:export`; the bearer scheme description names the OIDC issuer.
- `docs/hacks/api.md`, `docs/ideas/README.md` + `authentication.md`, `docs/architecture/`,
  `guide/security.md`, `guide/testing.md` (e2e users), `README.md` if it mentions the login stub.

## Tests

`npm test`, `npm run lint`, `npm run openapi:check`, e2e in CI. `test/openapi.e2e-spec.ts` no longer lists
`/auth/login`.
