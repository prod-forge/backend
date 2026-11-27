**Status:** ⏸ hold · **Version:** 2.0.0 · **Date:** 2026-11-17 · **Modules:** docker-compose, keycloak, .env.example, docs

# 01 — Keycloak in docker-compose

## Files

- `keycloak/realm-prod-forge.json` — realm `prod-forge`; clients `prod-forge-web`, `prod-forge-mobile` (public,
  PKCE S256, redirect URIs for `http://localhost:5173/*` and the Expo scheme `prodforge://`), `prod-forge-tests` (confidential,
  Direct Access Grants only); five users with fixed ids matching the seed; access token lifespan 5 minutes; an
  audience mapper so tokens carry `aud: prod-forge-api`.
- `docker-compose.yml` — `keycloak` (pinned image tag, `start-dev --import-realm`, port 8081, health check).
- `.env.example` — `OIDC_ISSUER_URL=http://localhost:8081/realms/prod-forge`, `OIDC_AUDIENCE=prod-forge-api`
  (hook-protected file: the owner applies this line).
- `docs/commands.md`, `docs/architecture/` — the new service and the dev users.

## Tests

Manual: `docker compose up`, the API starts, a token from the tests client works on `GET /api/v1/todos`.
