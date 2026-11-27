**Status:** ⏸ hold · **Version:** 1.0.2 · **Date:** 2026-11-17 · **Modules:** api DTOs, docs/openapi.json

# 01 — Response DTOs

## Files

- `src/api/todos/dtos/responses/todo-response.dto.ts` — `completed: boolean` (not optional);
  `@ApiProperty({ nullable: true, type: String })` on `description: null | string`, required.
- `src/shared/dtos/pagination.dto.ts` — `PaginatedResponseDto.data` no longer produces `items: { type: array }`;
  pick the decorator that keeps the `allOf` in `ApiPaginated` valid and check the exported schema.
- `src/api/version/dtos/version-response.dto.ts` (new) and `src/api/version/version.controller.ts` — response type and
  `@ApiOkResponse({ type: VersionResponseDto })`. The body stays `{ version }`.
- `docs/openapi.json` — `npm run openapi:export`.

## Checks

- The diff of `docs/openapi.json` changes only schemas, never paths or operation ids.
- No runtime change: `TodoResponseDto` is still built with `plainToInstance(..., { excludeExtraneousValues: true })`;
  making `completed` non-optional must not change what is returned (unit tests of the todos controller and service).

## Tests

- `npm run openapi:check`
- the todos and version controller unit tests
- `test/openapi.e2e-spec.ts` runs in CI (e2e is owner-run locally)
