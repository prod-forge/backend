**Status:** ✅ approved · **Version:** 2.0.0 · **Date:** 2026-11-17 · **Modules:** api auth, modules/auth, config, database-manager (User), docker-compose, test (e2e), load, docs/openapi.json, docs, guide

# 003 — OIDC authentication

## Goal

The API trusts access tokens issued by an OpenID Connect provider, verified with the issuer's public keys (JWKS), and
`POST /api/v1/auth/login` is gone. Locally and in e2e the provider is a Keycloak container with test users; on AWS it
is Cognito. The two-user ownership suite from [002-ownership-tests](../002-ownership-tests/readme.md) runs on tokens
obtained by a real login. Design: [00-design.md](./00-design.md).

Prerequisite: 002 is done. Frontend counterpart: frontend `docs/plans/003-oidc-login/`.

## Plans

1. [01-token-verification](./01-token-verification/readme.md) — RS256 verification through JWKS, issuer and audience
   checks, users provisioned from the token subject.
2. [02-local-identity-provider](./02-local-identity-provider/readme.md) — Keycloak in docker-compose and in e2e,
   ownership suite on real tokens, k6 on real tokens.
3. [03-remove-login-stub](./03-remove-login-stub/readme.md) — delete the stub, the HS256 secret and the hack entry;
   OpenAPI, guide and docs.

## Conclusions

_Written when the plan is done._
