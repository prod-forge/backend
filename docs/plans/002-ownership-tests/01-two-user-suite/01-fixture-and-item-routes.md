**Status:** 📝 draft · **Version:** — (tests only, no release) · **Date:** 2026-11-17 · **Modules:** test (e2e)

# 01 — Fixture and single-item routes

## Files

- `test/utils/test-users.ts` — `testUsers = { a: { id, headers }, b: { id, headers } }` built from
  `users.token.ts`. `request.headers.ts` re-exports from it, so other specs do not change.
- `test/todos-ownership.e2e-spec.ts` — `beforeAll` creates three todos per user (`ownership-<runId> a|b <n>`, the
  first completed), reads one of A's and one of B's by id so both are cached.
- `test/todos.e2e-spec.ts` — the `ownership` block is removed (its list-after-rename case stays in the main file under
  `PATCH`).

## Interfaces for later steps

```ts
type TestUser = { readonly id: string; readonly headers: Readonly<Record<'Authorization', string>> };
export const testUsers: { readonly a: TestUser; readonly b: TestUser };
```

## Tests

`it.each([['a', 'b'], ['b', 'a']])`, negative cases first:

- owner X's todo, caller Y: `GET /todos/:id` uncached and cached → 404 `TODO_NOT_FOUND`;
- `PATCH` with a new title and with `completed` → 404; `DELETE` → 404;
- afterwards X reads the todo unchanged (title and `completed`).

Positive: X reads, updates and deletes their own todo (the deleted one is recreated for step 02).

Run: `npm run test:e2e -- todos-ownership` (owner-run locally, or read the CI result on the PR).
