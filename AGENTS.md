# Project Guidelines

## Important

- Write production-ready code
- Prefer small focused files
- Add comments only when necessary
- Prefer explicitness over magic
- Preserve existing architecture and conventions
- Follow existing project patterns before introducing new ones
- Prefer extending existing code over introducing new abstractions
- Reuse existing utilities before creating new ones
- Do not refactor unrelated code unless explicitly requested
- Split overly complex files into smaller modules
- Prefer minimal diffs
- Avoid reformatting unrelated code
- Prefer readable and maintainable code
- Prefer simplicity over clever abstractions
- Avoid unnecessary abstractions

---

## TypeScript Rules

- Use TypeScript strict mode
- Avoid `any`
- Prefer explicit types for public APIs
- Prefer `type` over `interface`
- Use discriminated unions when appropriate
- Prefer readonly where possible
- Avoid unnecessary generics

---

## NestJS Rules

- Follow NestJS modular architecture
- Keep modules focused and cohesive
- Use dependency injection instead of manual instantiation
- Keep controllers thin
- Move business logic to services
- Avoid placing business logic inside controllers
- Prefer composition over inheritance
- Use providers for reusable logic
- Keep DTOs explicit and validated
- Use class-validator and class-transformer for request validation
- Prefer constructor injection
- Avoid circular dependencies
- Keep guards, interceptors, and pipes reusable and focused
- Prefer explicit return types for services and controllers

---

## API Rules

- Use async/await
- Handle errors explicitly
- Use NestJS exception filters when appropriate
- Validate all external input
- Do not expose internal errors to clients
- Keep API logic inside services
- Keep controllers responsible only for transport layer concerns
- Prefer RESTful conventions unless project architecture requires otherwise

---

## Database Rules

- Keep database access inside dedicated repositories/services
- Avoid direct database access inside controllers
- Keep queries readable and maintainable
- Prefer transactions for multi-step mutations
- Avoid N+1 query patterns
- Keep entity models focused and explicit

---

## Testing Rules

- Tests must be deterministic
- Keep tests readable and explicit
- Avoid duplicated setup logic
- Use descriptive test names
- Mock external dependencies when appropriate
- Keep unit and integration tests isolated

### Test Structure

- Negative test cases must go first
- Positive test cases must go after negative cases
- Negative and positive cases must be placed in separate `describe` blocks
- Separate describe blocks with an empty line
- Keep test structure consistent across the project

Example:

```ts
describe('UsersService', () => {
  describe('negative cases', () => {
    it('throws when user does not exist', async () => {});
  });

  describe('positive cases', () => {
    it('returns user by id', async () => {});
  });
});
```

---

## Git Commit Policy

- Never add `Co-Authored-By` or any other Claude/AI attribution to commits or pull requests
- Commit messages describe only the actual changes
- The `commit-msg` hook rejects messages with AI attribution trailers

---

## Ignore Rules

Do not analyze or modify generated/dependency files.

Ignore:

- node_modules
- dist
- build
- coverage
- \*.generated.ts
- package-lock.json
- yarn.lock
- pnpm-lock.yaml

Never edit generated code manually.

---

## Cost Saving Rules

- Run only affected tests when possible
- Do not run the entire test suite for small isolated changes
- If only one test file was modified, run only that test file
- If only one module/service/controller changed, avoid unrelated validations
- Read only files relevant to the current task
- Avoid scanning the entire repository unless necessary

---

## Documentation

Agent reference docs live in `docs/`; the human guide lives in `guide/`:

- `docs/goal.md` — what the project is and what it must achieve
- `docs/architecture/` — layers, modules, request lifecycle, observability (`overview.md`), endpoints, envelope and error codes (`api.md`), Prisma models, indexes and migrations (`data-schema.md`), how to add a feature, endpoint or migration (`patterns.md`)
- `docs/commands.md` — setup, environment variables, running, testing, linting, Docker, release, commit convention
- `docs/openapi.json` — the committed HTTP contract, regenerated with `npm run openapi:export`, never edited by hand
- `docs/restrictions/` — constraints of this project, with the reason and where each is enforced
- `docs/plans/` — what is being implemented now
- `docs/ideas/` — raw high-level ideas
- `docs/roadmap/` — ideas scheduled into versions; the public list of open work is `roadmap.md`
- `docs/open-issues/` — deferred known problems
- `docs/postmortem/` — attempts that did not work, and why
- `docs/hacks/` — non-obvious decisions and shortcuts

When making changes that affect any of the above, update the relevant doc in the same task. Do not defer doc updates to a follow-up. Do not update docs for internal refactors that have no observable effect on architecture, API contracts, schema, or developer workflow.

The human guide in `guide/` is updated when the behaviour it describes changes.

## Planning

- Before writing a new plan, read `docs/goal.md`, `docs/architecture/` and `docs/restrictions/`
- Plans follow `docs/plans/README.md`: a global plan (`NNN-<name>/` with `readme.md` and `00-design.md`), plans inside it, one file per step; every level carries status, version, date and modules
- The design ends with open questions, the user's decisions and your own calls to check; implement only approved plans
- A plan is done when its conclusions are written and the user has looked at its result
- Shortcuts go to `docs/hacks/`, deferred problems to `docs/open-issues/`, failed attempts to `docs/postmortem/`
