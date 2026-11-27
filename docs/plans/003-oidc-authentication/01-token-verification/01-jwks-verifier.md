**Status:** ⏸ hold · **Version:** 2.0.0 · **Date:** 2026-11-17 · **Modules:** modules/auth, config, error-handler

# 01 — JWKS verifier

## Files

- `src/config/auth.config.ts` — `OIDC_ISSUER_URL` (URL), `OIDC_AUDIENCE` (string); `JWT_SECRET`/`JWT_TTL` stay
  until plan 03 so the stub keeps working in between.
- `src/modules/auth/auth.service.ts` — `verifyAccessToken(token): Promise<VerifiedToken>` with one
  `createRemoteJWKSet(jwksUri)` per process; `jwksUri` comes from the discovery document
  (`<issuer>/.well-known/openid-configuration`), fetched on the first verification and retried on failure, so the API
  starts even when the provider is down.
- `src/error-handler/errors/` — `AuthProviderUnavailableError` (503, `AUTH_PROVIDER_UNAVAILABLE`).
- `package.json` — `jose`.

## Interfaces for later steps

```ts
type VerifiedToken = { readonly subject: string };
verifyAccessToken(token: string): Promise<VerifiedToken>;
```

## Tests

`src/modules/auth/auth.service.spec.ts`, keys generated in the test with `jose.generateKeyPair` and a local JWKS
(`createLocalJWKSet` injected), negative cases first: wrong signature, `HS256` token, `alg: none`, wrong `iss`,
wrong audience, expired, `nbf` in the future, missing `sub` → 401; JWKS fetch error → 503. Positive: valid token with
`aud`, valid Cognito-style token with `client_id`.

Run: `npm test -- src/modules/auth`.
