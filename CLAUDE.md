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

## Documentation Rules

After every change, update any affected documentation in `.claude/docs/`:

- **`architecture.md`** — update when modules are added/removed, middleware/interceptor/filter wiring changes, or request lifecycle changes
- **`api.md`** — update when endpoints are added/removed/modified, request/response shapes change, new error codes are introduced, or auth behavior changes
- **`db-schema.md`** — update when the Prisma schema changes (new models, fields, indexes, or relations)
- **`developers-guide.md`** — update when setup steps change, new env variables are added, scripts are modified, or new patterns for adding features are established

Do not update docs for internal refactors that have no observable effect on architecture, API contracts, schema, or developer workflow.
