**Status:** ✅ approved · **Version:** — (tests only, no release) · **Date:** 2026-11-17 · **Modules:** test (e2e), docs

# Design: ownership tests for every todo route

## Intent

A review suggestion the owner wants to take:

> before high-load work, replace the auth stub and add a two-user test: user b must not read, update, or delete user a's
> todo by swapping its ID. include list responses too, so ownership filtering is exercised as well as the single-item
> routes.

This plan covers the test. The auth replacement is [003-oidc-authentication](../003-oidc-authentication/readme.md).

## Current state

- `test/todos.e2e-spec.ts`, `describe('ownership')` (line 518) already covers the single-item routes: another user gets
  `404 TODO_NOT_FOUND` on `GET`, `PATCH` and `DELETE /todos/:id`, including a cached `GET`, and the todo is unchanged
  afterwards.
- Nothing checks the list. `GET /todos` filters by `userId` in the query and caches under
  `TodosCacheKeys.todos(userId, query)`; a regression in either (a dropped `where`, a key without `userId`) would pass
  every current test, because only user A ever creates todos in the e2e run and the seeded users' todos are never
  compared against the caller.
- The second user exists only as a token (`test/utils/users.token.ts`, `OTHER_USER_ID`); it owns no todos created by
  the suite. Tokens are signed in the test, not obtained by login.

## Goals

1. Both users own todos created by the suite, with a shared unique marker in the title, so a leak is visible in a
   search response.
2. Single-item routes: B gets 404 on read, update and delete of A's todo, cached and uncached; A's todo is unchanged.
3. List routes, for B: no A todo in `data` for the default list, `search` on the marker, `completed=true|false`,
   sorting and every page; `meta.total` and `meta.completed` count only B's todos; a list A has just cached is not
   served to B for the same query.
4. Symmetric: the same checks with A and B swapped, so the test does not depend on which user is seeded first.
5. A user helper the auth plan can switch from signed tokens to real login without touching the cases.

## Non-goals

- Changing the API or the repository code. If a case fails, the fix is a separate `fix:` commit with its own review.
- Load or concurrency tests.

## Design

- New file `test/todos-ownership.e2e-spec.ts`; the `ownership` block moves there from `todos.e2e-spec.ts`, so the main
  file stays about behaviour and this one about isolation.
- `test/utils/test-users.ts` exports `testUsers: { a, b }`, each `{ id, headers }`. Today `headers` come from the
  signed tokens in `users.token.ts`; plan 003 replaces only this file.
- Data per run: each user creates three todos titled `ownership-<runId> <user> <n>`, one of them completed. `runId`
  keeps parallel or repeated runs apart. Expected values are computed from what the suite created, never from seed
  counts.
- Cases are a table over the operations and the user pair (`it.each`), negative cases first, per `AGENTS.md`.

## Open questions

None.

## Decisions

- 2026-11-17 — Ownership tests ship first as their own plan; the auth replacement follows and re-runs them through real
  login. Both come before high-load work.
- 2026-11-17 — The agent's calls below are confirmed. The plan is approved.

## Agent's calls (to check)

All confirmed by the owner on 2026-11-17.

1. Ownership cases move to `test/todos-ownership.e2e-spec.ts` instead of growing `todos.e2e-spec.ts`.
2. No release: the change is `test:` only. If a case finds a leak, the fix is a patch release (`1.0.2`).
3. The list checks use a unique `search` marker and also walk all pages of the unfiltered list (`limit=100`), because a
   marker search alone would miss a leak that only shows without a filter.
