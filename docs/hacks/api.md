# API hacks

## Login without a password

- **What:** `POST /api/v1/auth/login` returns a signed token for any registered email; no password is checked. It is throttled to 5 requests per minute.
- **Where:** `src/api/auth/auth.controller.ts` (`@Post('login')`, the Swagger description says "Development stub"); `guide/security.md`, "Authentication and Authorization".
- **Why:** the API verifies tokens but does not run an identity provider; a stub that pretends to check passwords would be worse than an honest one. A real system delegates login to Cognito, Auth0 or Keycloak (`guide/security.md`).
- **If cleaned up:** adding a password check here turns the stub into a half-built identity provider; the decision is to replace the endpoint, not to extend it.

## Web log metadata read as optional

- **What:** `processWebLog` casts `dto.metadata` to `Partial<...> | undefined` although validation requires it, and strips query strings and hashes from `url` and `fullUrl`.
- **Where:** `src/features/client-logs/client-logs.service.ts` (comments in the file).
- **Why:** the endpoint is public and must not fail on a missing field; query strings and hashes can carry tokens or personal data.
- **If cleaned up:** removing the cast makes the public endpoint throw on malformed input; logging full URLs leaks tokens into the logs.
