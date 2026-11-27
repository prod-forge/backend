**Status:** ⏸ hold · **Version:** — (tests only, no release) · **Date:** 2026-11-17 · **Modules:** test (e2e)

# 02 — List routes

## Files

- `test/todos-ownership.e2e-spec.ts` — `describe('GET /api/v1/todos')`.
- `test/utils/list-all.ts` — `listAll(headers, query)`: follows `offset` with `limit=100` until `data` is empty,
  returns every item and the last `meta`.

## Tests

For both directions (`it.each`), negative cases first:

- `search=ownership-<runId>`: only the caller's three todos; none of the other user's ids or titles;
- `completed=true` and `completed=false` with the marker: only the caller's todos, counts 1 and 2;
- every page of the unfiltered list (`listAll`): none of the other user's ids;
- `meta.total` and `meta.completed` for the marker search are 3 and 1, whatever the other user owns;
- list cache: X requests a query, Y requests the same query right after, Y's response holds only Y's todos;
- after Y's rejected `PATCH` and `DELETE` on X's todo, X's list for the marker is unchanged.

Positive: a todo X creates appears in X's list for the marker and in no list of Y; `sortBy=title` in both orders
returns the caller's three titles.

Run: `npm run test:e2e -- todos-ownership`.

## Done when

The suite passes in CI on the PR, and reverting the `userId` filter in the list query or the `userId` part of the list
cache key (checked locally, not committed) makes it fail.
