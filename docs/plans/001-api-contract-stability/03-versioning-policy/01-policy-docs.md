**Status:** ⏸ hold · **Version:** 1.0.2 · **Date:** 2026-11-17 · **Modules:** docs, guide

# 01 — Policy docs

## Files

- `docs/restrictions/api.md` (new) — rule / reason / where, as in the design:
  - additive changes only inside a version;
  - what counts as breaking (removed or renamed response field, changed type or nullability, new required request
    field, removed endpoint or status code);
  - a breaking change goes to a new controller version served in parallel;
  - deprecation: `Deprecation: @<unix seconds>` (RFC 9745), `Sunset: <HTTP-date>` (RFC 8594),
    `Link: <successor>; rel="successor-version"`; removal only after the sunset date and after the clients that call
    it are updated;
  - where: `api-contract` CI job, `docs/openapi.json`, the `api-breaking-approved` label.
- `docs/restrictions/README.md` — list `api.md`.
- `docs/architecture/api.md` — a "Versioning" section linking the restriction.
- `guide/documentation.md` — why the contract is compared, not only re-exported; why clients parse with non-strict
  schemas (link the frontend plan).
- `docs/ideas/` — `minimum-client-version.md`: `X-Client-Version`, `426 CLIENT_UPGRADE_REQUIRED`, why it is deferred.

## Tests

- `npx cspell` / the docs lint the repository runs on Markdown
- links in the new files resolve
