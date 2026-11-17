**Status:** 📝 draft · **Version:** 2.0.0 · **Date:** 2026-11-17 · **Modules:** api auth, modules/auth, config, database-manager (User), docker-compose, test (e2e), load, docs/openapi.json, docs, guide

# Design: OIDC authentication

## Intent

The same review suggestion as [002-ownership-tests](../002-ownership-tests/00-design.md): replace the auth stub before
high-load work, with a two-user test that also covers lists. 002 adds the test; this plan replaces the stub.

## Current state

- `POST /api/v1/auth/login` (`src/api/auth/auth.controller.ts`) returns an HS256 token signed with `JWT_SECRET`
  for any registered email; no password (`docs/hacks/api.md`, "Login without a password").
- `AuthGuard` (`src/common/guards/auth.guard.ts`) parses `Bearer` and calls `AuthService.verifyToken`, which
  verifies HS256 and returns `sub` as `userId`. Everything after the guard (`@User()`, todos service, throttler by
  user) only needs `req.userId`.
- `User` has `id`, `email` (unique), `name`; users exist only through the seed.
- `docs/hacks/api.md` already says the stub is to be replaced by an identity provider, not extended;
  `docs/ideas/authentication.md` lists refresh tokens, logout and revocation; `guide/security.md` names Cognito,
  Auth0 and Keycloak.
- `load/k6-smoke.js` logs in through the stub in `setup()`; e2e tokens are signed in `test/utils/users.token.ts`.

## Goals

1. The API verifies RS256 access tokens from a configured issuer: signature through the issuer's JWKS (cached, rotated
   keys refetched), `iss`, `aud` (or `client_id` for Cognito access tokens), `exp`, `nbf`, algorithm allow-list.
2. Any provider that speaks OIDC works through configuration only: `OIDC_ISSUER_URL`, `OIDC_AUDIENCE`; no
   provider SDK in the API.
3. A user row is created on the first authenticated request from the token subject; todos keep referencing
   `User.id`.
4. Local development and e2e run against Keycloak with seeded users; no AWS account is needed to run the project.
5. The ownership suite from 002 passes with tokens obtained from Keycloak for two different users.
6. The login stub, `JWT_SECRET`, `JWT_TTL` and the HS256 code are removed.

## Non-goals

- Sign-up, passwords, MFA, recovery, refresh-token rotation and revocation inside the API: the provider owns them.
  Logout is a client and provider concern; access tokens stay short-lived (provider setting, 5–15 minutes).
- Roles and permissions: the todo domain has one role. Ownership stays the only authorization rule.
- The Cognito user pool itself: it is a terraform change (see "Terraform follow-up").
- Deploying anything: deploys stay disabled.

## Design

### Verification (plan 01)

- `AuthService.verifyToken` uses `jose` (`createRemoteJWKSet` + `jwtVerify`) with
  `algorithms: ['RS256']`, `issuer`, and an audience check that accepts `aud` or `client_id` (Cognito access
  tokens have no `aud`). Any failure maps to the existing `UserIsNotAuthorizedError` (401); a JWKS fetch failure is
  logged and answered with 503 `AUTH_PROVIDER_UNAVAILABLE`, so a provider outage is not reported as a bad token.
- `authConfig` gets `OIDC_ISSUER_URL` and `OIDC_AUDIENCE`, validated at startup like the other config.
- `User` gets `subject String @unique` (the token `sub`) and `email` becomes optional and non-unique (the
  provider owns it; it is stored for display only). The migration SQL is proposed in the PR and landed by the
  owner (`docs/restrictions/database.md`); seeded users get the subjects of the Keycloak test users.
- `UsersService.resolveBySubject(sub, claims)` returns `User.id`, creating the row on first sight (upsert on
  `subject`), cached in Redis by subject so a request costs no extra query. The guard sets `req.userId` to this id,
  so nothing after the guard changes.

### Local provider (plan 02)

- `docker-compose.yml` adds `keycloak` (`start-dev`, realm import from `keycloak/realm-prod-forge.json`):
  realm `prod-forge`, public client `prod-forge-web` and `prod-forge-mobile` (Authorization Code + PKCE, redirect
  URIs of the web dev server and the Expo scheme `prodforge://`), confidential client `prod-forge-tests` with Direct Access Grants for
  e2e and k6 only, users `user1@example.com` … `user5@example.com` with dev passwords matching the seed.
- e2e global setup starts Keycloak with testcontainers next to Postgres and Redis, imports the same realm, and
  `test/utils/test-users.ts` (from 002) gets tokens through the password grant of `prod-forge-tests`. The ownership
  cases do not change.
- `load/k6-smoke.js` `setup()` takes tokens from Keycloak the same way; the 5-per-minute login throttle note goes
  away.

### Removal (plan 03)

- Delete `src/api/auth/`, `LoginDto`, `TokenResponseDto`, `AuthService.issueToken`, `UsersService.issueTokenByEmail`,
  `@nestjs/jwt`, `JWT_SECRET`, `JWT_TTL`, the login throttle; `npm run openapi:export`.
- `docs/hacks/api.md` loses "Login without a password"; `docs/ideas/authentication.md` moves to done (removed from
  ideas); `guide/security.md` "Authentication and Authorization" is rewritten; `docs/architecture/` and
  `docs/commands.md` describe the Keycloak service.

## Terraform follow-up

A Cognito user pool, app clients for web and mobile (no secret, PKCE), the hosted domain, and the API task environment
(`OIDC_ISSUER_URL`, `OIDC_AUDIENCE`) in the terraform repository, as its own plan. Written after this design is
approved; the backend release does not wait for it, since nothing is deployed.

## Compatibility

Removing `POST /auth/login` and changing the token format break every installed client: old tokens stop working and
old builds cannot log in. Hence a major version, released together with the frontend plan, backend first.

## Open questions

1. Does the backend keep any user-facing data from the token (name, email) or only `sub`? The frontend shows the
   email from its own session today; the token's `email` claim can replace it on the client side alone.
2. Write the terraform Cognito plan now, or when 003 is approved?

## Decisions

- 2026-11-17 — Replace the stub with generic OIDC: the API verifies tokens through the issuer's JWKS and stays
  provider-agnostic; Keycloak locally and in e2e, Cognito on AWS; clients use Authorization Code + PKCE.
- 2026-11-17 — Order: 002 (ownership tests) first, then this plan; both before high-load work.

## Agent's calls (to check)

1. `jose` for verification instead of `passport-jwt` + `jwks-rsa`: one small dependency, no Passport, the guard
   stays as it is.
2. Users are created on first request (just-in-time), keyed by `sub`; no sign-up endpoint and no provider webhook.
3. A JWKS fetch failure answers 503 `AUTH_PROVIDER_UNAVAILABLE`, not 401, so clients do not log the user out during a
   provider outage.
4. Direct Access Grants (password grant) are enabled only on the confidential `prod-forge-tests` client, for e2e and
   k6; the browser and mobile clients cannot use it.
5. Backend version 2.0.0 (breaking: endpoint removed, token format changed); the frontend ships its matching major in
   the same release window.
6. The `/api/v1` prefix stays: the todo contract does not change, only how a caller proves who they are.
