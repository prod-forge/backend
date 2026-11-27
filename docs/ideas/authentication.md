# Real authentication

## Problem

`POST /api/v1/auth/login` is a development stub: it returns a signed token for any registered email and checks no password (`docs/hacks/api.md`). The API verifies tokens but has no real login flow.

## Direction

- Delegate login to an identity provider (Cognito fits the AWS setup; Auth0 or Keycloak are alternatives, as `guide/security.md` says).
- Refresh tokens, logout and token revocation; roles if the todo domain needs them.
- Update both frontend clients and the guide chapter on security in the same change.
