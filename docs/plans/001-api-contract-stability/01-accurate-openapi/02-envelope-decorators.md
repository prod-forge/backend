**Status:** ⏸ hold · **Version:** 1.0.2 · **Date:** 2026-11-17 · **Modules:** swagger decorators, docs/openapi.json

# 02 — Envelope decorators

## Files

- `src/common/decorators/swagger.decorators.ts`
  - `ApiOk`: schema `{ type: 'object', required: ['data'], properties: { data: { $ref } } }`; the unused `metaModel`
    option and its top-level `oneOf` are removed.
  - `ApiPaginated`: the second `allOf` member gets `type: 'object'` and `required: ['data', 'meta']`.
- `docs/openapi.json` — `npm run openapi:export`.
- `docs/architecture/api.md` — the envelope description, if it shows the decorator output.

## Interfaces for later steps

The document plan 02 compares against: every 2xx JSON response has a required `data`, and paginated ones a required
`meta`.

## Tests

- `npm run openapi:check`
- a unit test for the decorators, if one exists, extended with negative cases first: the envelope lists `data` as
  required; `ApiOk` no longer accepts `metaModel` (type check)
- `npx knip` stays clean
