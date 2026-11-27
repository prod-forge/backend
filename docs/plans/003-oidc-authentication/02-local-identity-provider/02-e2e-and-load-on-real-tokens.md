**Status:** ⏸ hold · **Version:** 2.0.0 · **Date:** 2026-11-17 · **Modules:** test (e2e), load

# 02 — e2e and k6 on real tokens

## Files

- `test/setup/setup.global.ts` — a Keycloak testcontainer with the realm file; sets `OIDC_ISSUER_URL` and the tests
  client secret.
- `test/utils/test-users.ts` — `testUsers.a/b` get tokens by the password grant of `prod-forge-tests`; the shape
  from 002 does not change. `users.token.ts` is deleted.
- `test/auth.e2e-spec.ts` — rewritten: no token → 401, token from another realm → 401, expired token → 401, Keycloak
  token → 200 and the user row exists after the first call.
- `load/k6-smoke.js` — `setup()` takes tokens from Keycloak.

## Tests

`npm run test:e2e`: the ownership suite from 002 passes unchanged on real tokens. CI on the PR is the gate.
