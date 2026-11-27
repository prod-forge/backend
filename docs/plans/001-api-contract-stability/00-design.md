**Status:** ⏸ hold · **Version:** 1.0.2 · **Date:** 2026-11-17 · **Modules:** api DTOs, swagger decorators, docs/openapi.json, CI, docs, guide

# Design: API contract stability

## Intent

A review comment on the frontend said that the bugs that hurt most in a shared client core are "one platform holding
an old response shape after a release". The frontend answers it with its global plan `001-api-contract` (frontend
repository, `docs/plans/`): every response is parsed with a Zod schema at the API client boundary. The owner asked
whether the backend should add something about versioning, and chose these three items:

1. an accurate OpenAPI description of the responses;
2. a breaking-change check in CI;
3. a versioning policy.

## Current state

- URI versioning is on (`app.enableVersioning({ type: VersioningType.URI })` in `src/app.setup.ts`); the routes are
  `/api/v1/...`, and `/api/version` reports the app version.
- `docs/openapi.json` is committed; `npm run openapi:check` (CI `lint` job) and `test/openapi.e2e-spec.ts` fail when it
  drifts from the code. They catch drift, not breaking changes: a pull request that removes a response field
  re-exports the document and passes.
- The document does not describe the responses accurately:
  - `TodoResponseDto.description` is `{ type: object, nullable: true }` and not required (the `null | string` union
    reflects as `Object`); it is always present and is a string or `null`.
  - `TodoResponseDto.completed` is required in the document but optional (`completed?`) in the class.
  - `PaginatedResponseDto.data` is `{ type: array, items: { type: array } }` (`@ApiProperty({ isArray: true })` with
    no type).
  - The `{ data }` envelope in `ApiOk` and `ApiPaginated` (`src/common/decorators/swagger.decorators.ts`) has no
    `type: object` and no `required: ['data']`, so a response without `data` still matches it.
  - `ApiOk` pushes a `metaModel` `oneOf` into the top-level `allOf` (the whole body would have to be the meta object or
    `null`); no endpoint passes `metaModel` to `ApiOk`, so it is dead and wrong.
  - `GET /api/version` has no response schema.
- Breaking changes are not compared. A diff tool can only be trusted after the above is fixed: today a removed
  `description` would look like a change of an `object` nobody uses.

## Goals

1. `docs/openapi.json` describes every 2xx response body exactly, with required fields and nullability.
2. A pull request that makes a breaking change to an existing operation fails CI and says which change broke what.
3. The rule for what may change inside `v1`, and how a `v2` and a deprecation are introduced, is written down.

## Non-goals

- A `v2` of any endpoint. Nothing needs one now.
- `Deprecation` / `Sunset` headers in code. No endpoint is deprecated; the policy describes the headers, and the code
  comes with the first deprecation.
- A minimum client version (`X-Client-Version`, `426 CLIENT_UPGRADE_REQUIRED`): stays an idea
  (`docs/ideas/`), decided 2026-11-17.
- Checking request schemas beyond what the diff tool reports; request DTOs are already validated at runtime.

## Design

### 1. Accurate OpenAPI (plan 01)

- `TodoResponseDto`: `completed: boolean` (required, as returned); `description` with
  `@ApiProperty({ nullable: true, type: String })`, required.
- `PaginatedResponseDto.data`: the generic class cannot name its item type, so it is described only through
  `ApiPaginated`; the base property gets `@ApiProperty({ isArray: true, type: Object })` or is dropped from the base
  schema — whichever produces a valid `allOf` (checked in the step).
- `ApiOk` / `ApiPaginated`: the envelope is `{ type: 'object', required: ['data'], properties: { data } }` (and `meta`
  required for the paginated one). The unused `metaModel` option of `ApiOk` is removed.
- `VersionResponseDto` (`{ version: string }`) for `GET /api/version`.
- `npm run openapi:export`, review the diff of `docs/openapi.json` by hand: it must change only descriptions, never
  routes.

### 2. Breaking-change check (plan 02)

- A new CI job `api-contract` in `.github/workflows/ci.yml`, on `pull_request` only: it reads the base document with
  `git show origin/<base>:docs/openapi.json` and runs `oasdiff breaking base.json docs/openapi.json --fail-on ERR` from
  the official image, pinned to an exact version.
- The output is printed in the job log and written to the job summary, so the failing change is named in the PR.
- Push to `main` and the CD workflow do not run it: there is nothing to compare against after a merge.
- Escape hatch: a pull request with the label `api-breaking-approved` skips the failing exit code (the report is still
  printed). The label is for a breaking change the owner accepts knowingly (for example a field no client reads); the
  normal way is a new version (policy below).
- Local run documented in `docs/commands.md` as a `docker run` one-liner; no new npm dependency.

### 3. Versioning policy (plan 03)

`docs/restrictions/api.md`, rule / reason / where:

- Inside a version (`v1`) changes are additive only: new endpoints, new optional request fields, new response fields.
- Removing or renaming a response field, changing its type or nullability, making a request field required, or
  removing an endpoint needs a new version of that controller (`@Controller({ version: '2' })`), with `v1` served in
  parallel.
- A deprecated version answers with `Deprecation` (RFC 9745) and `Sunset` (RFC 8594) headers and a
  `Link: <...>; rel="successor-version"`, and is removed only after the sunset date and after the clients that call it
  are updated.
- Reason: installed mobile builds keep calling the old shape for weeks; the frontend parses responses with non-strict
  schemas, so added fields are safe and removed or changed ones fail.
- Where: `api-contract` CI job, `docs/openapi.json`.

The guide (`guide/documentation.md`, the OpenAPI section) explains why, and `docs/architecture/api.md` links the rule.

## Open questions

None.

## Decisions

- 2026-11-17 — Items 1–3 go into this plan; the minimum client version stays an idea.
- 2026-11-17 — The agent's calls below are confirmed. The plan is approved and put on hold: not implemented for now.

## Agent's calls (to check)

All confirmed by the owner on 2026-11-17.

1. `oasdiff` from its Docker image in CI, pinned to an exact version, not an npm package or a third-party action, so
   nothing new enters `package.json` and the job needs only `contents: read`.
2. The check runs on `pull_request` only, against the PR base branch.
3. Escape hatch through the `api-breaking-approved` label instead of no escape at all.
4. The policy describes the `Deprecation` / `Sunset` headers but builds no code for them until the first deprecation.
5. Version 1.0.2 (patch): no runtime behaviour changes, only Swagger metadata, CI and docs.
6. Plan 01 lands before plan 02, so the first comparison runs against an already accurate document and the description
   fixes themselves are not reported as breaking.
