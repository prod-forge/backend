# Code Style Guide

This document captures the conventions, patterns, and style rules observed and enforced in this codebase.

---

## Directory Structure

```
src/
  api/           # Controllers and DTOs (transport layer only)
  common/        # Cross-cutting concerns: decorators, guards, interceptors, utils
  config/        # Config factories with validation
  constants/     # Shared constants
  error-handler/ # Centralized error system: errors, filters, mappers, parsers
  features/      # Business logic: services, repositories, entities, mappers
  logger/        # Logging infrastructure
  mocks/         # Shared test mocks
  modules/       # Infrastructure modules (Redis, Prisma, Sentry, Metrics, etc.)
  shared/        # Shared DTOs, entities, interfaces
```

Feature anatomy inside `src/features/<feature>/`:

- `<feature>.service.ts`
- `<feature>.repository.ts`
- `<feature>.module.ts`
- `entities/<feature>.entity.ts`
- `mappers/<feature>.mapper.ts`
- `cache-queries/<feature>.cache-queries.ts`
- `types/<feature>.query.ts`
- `interfaces/queries.enum.ts`

Controller anatomy inside `src/api/<feature>/`:

- `<feature>.controller.ts`
- `dtos/requests/`, `dtos/responses/`, `dtos/queries/`

---

## File Naming

- All files use `kebab-case`.
- Suffix reflects the role: `.service.ts`, `.controller.ts`, `.repository.ts`, `.module.ts`, `.entity.ts`, `.mapper.ts`, `.guard.ts`, `.interceptor.ts`, `.middleware.ts`, `.decorator.ts`, `.dto.ts`, `.enum.ts`.
- Spec files co-located: `<name>.spec.ts`.
- Base/abstract classes prefixed with `_base.` (e.g. `_base.error.ts`, `_base.client.ts`). The eslint filename-naming-convention rule is suppressed on these with a comment.
- Error files grouped by domain: `todo.errors.ts`, `user.errors.ts`, `common.errors.ts`.

---

## TypeScript

- `strict` mode enabled.
- Use `type` over `interface` for shapes, with exceptions for NestJS-imposed interfaces.
- Use `import type` for type-only imports.
- Alphabetical ordering of class members (properties and methods both, properties first).
- Explicit return types on all public methods.
- `readonly` on all injected services and private fields where mutation is not needed.
- Private class fields using `#` syntax for truly private state (e.g. `#appName`).
- Enums use `SCREAMING_SNAKE_CASE` for keys, camelCase or lowercase string values.
- Avoid `any`; use generics or `unknown` where needed.
- Use discriminated unions and conditional spread (`...(condition && { key: value })`) over verbose if/else assignments.

---

## Import Order

Imports are grouped and ordered as follows (enforced by eslint-import-order):

1. `import type` statements (NestJS types, config types, third-party types)
2. NestJS core imports
3. Third-party library imports
4. Local relative imports

Blank line separates each group. Example:

```ts
import type { ConfigType } from '@nestjs/config';

import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { LoggerService } from '../../../logger/logger.service';
import { RedisManagerService } from '../redis-manager.service';
```

---

## NestJS Modules

- Each module is focused on a single domain or infrastructure concern.
- Module file declares `controllers`, `imports`, `providers`, and `exports` explicitly.
- Infrastructure modules (`PrismaModule`, `RedisManagerModule`, etc.) are imported where needed rather than made global.
- `ConfigModule` is global (`isGlobal: true`) — configs injected via `@Inject(config.KEY)`.

```ts
@Module({
  controllers: [TodosController],
  imports: [PrismaModule, RedisManagerModule],
  providers: [TodosService, TodosRepository],
})
export class TodosModule {}
```

---

## Controllers

- Controllers live in `src/api/<feature>/`.
- Thin: no business logic. Responsible only for transport (routing, guards, response mapping).
- Use `@Controller({ path, version })` for versioned routes.
- Response objects built with `plainToInstance(ResponseDto, result, { excludeExtraneousValues: true })`.

### Decorator order on controller methods

```ts
@ApiErrors(...)          // Swagger error documentation first
@ApiOk(...)              // or @ApiPaginated / @ApiEmpty
@Post()                  // HTTP method decorator
@UseGuards(AuthGuard)    // Guards last
async create(...) {}
```

```ts
@ApiTags('Todos')
@Controller({ path: 'todos', version: '1' })
export class TodosController {
  constructor(private readonly todoService: TodosService) {}
}
```

---

## Services

- Services live in `src/features/<feature>/`.
- Contain all business logic including cache coordination.
- All dependencies injected via constructor with `private readonly`.
- Explicit return types on all methods.
- Throw domain errors (`BaseError` subclasses), never raw strings or generic `Error`.

```ts
@Injectable()
export class TodosService {
  constructor(
    private readonly todosRepository: TodosRepository,
    private readonly cacheStorage: CacheStorage,
  ) {}
}
```

---

## Repositories

- Live in `src/features/<feature>/`.
- Only place that interacts with Prisma directly.
- Use `this.prisma.$transaction([...])` for multi-step reads/writes.
- Map Prisma models to domain entities via the feature's `Mapper` class.
- Do not throw domain errors — return `void` or `undefined` for not-found, let the service decide.

```ts
async findOne(id: string): Promise<TodoEntity | void> {
  const todo = await this.prisma.todo.findUnique({ where: { id } });
  if (todo) return TodoMapper.toEntity(todo);
}
```

---

## Entities

- Plain classes, no NestJS or Prisma decorators.
- Constructor accepts `Partial<Entity>` and uses `Object.assign(this, partial)`.
- Properties listed alphabetically.

```ts
export class TodoEntity {
  completed: boolean;
  description: null | string;
  id: string;
  title: string;

  constructor(partial: Partial<TodoEntity>) {
    Object.assign(this, partial);
  }
}
```

---

## Mappers

- Static classes with static methods only (no instances).
- Single responsibility: map from Prisma model to domain entity.
- Use `import type` for Prisma-generated types.

```ts
export class TodoMapper {
  static toEntity(todo: Todo): TodoEntity {
    return new TodoEntity({ ... });
  }
}
```

---

## DTOs

### Request DTOs

- Use `class-validator` decorators for validation.
- Use `@ApiProperty` / `@ApiPropertyOptional` for Swagger documentation.
- Decorator order: `@ApiProperty*` → validation decorators.
- Boolean query params: transform with `@Transform(({ value }) => value === 'true' || value === true)`.
- Numeric query params: use `@Type(() => Number)` with `@IsInt()`.

### Response DTOs

- Use `@Expose()` from `class-transformer` on every property.
- Use `@Type(() => NestedDto)` for nested objects/arrays.
- Use `@ApiProperty()` for Swagger documentation.
- Properties listed alphabetically.

### Query DTOs

- Combine `@ApiPropertyOptional`, validation decorators, and transform decorators.
- Always mark query fields `@IsOptional()`.

---

## Error Handling

### Error classes

All domain errors extend `BaseError<TDetails>`:

```ts
export class TodoNotFoundError extends BaseError<{ id: string }> {
  static code = ErrorCodes.TODO_NOT_FOUND;
  static domain = ErrorCategory.DOMAIN;
  static message = 'Todo not found';
  static status = HttpStatus.NOT_FOUND;

  constructor(id: string) {
    super(TodoNotFoundError.message, TodoNotFoundError.code, TodoNotFoundError.domain, TodoNotFoundError.status, {
      id,
    });
  }
}
```

Rules:

- Static properties for `code`, `domain`/`category`, `message`, `status`.
- Constructor delegates to `super()` using the static properties.
- Group errors by domain: `todo.errors.ts`, `user.errors.ts`, `common.errors.ts`, `redis.errors.ts`, `database.errors.ts`.

### Error codes and categories

- `ErrorCodes` enum: `SCREAMING_SNAKE_CASE` string values.
- `ErrorCategory` enum: `APPLICATION`, `DOMAIN`, `INFRASTRUCTURE`, `SECURITY`, `UNKNOWN`, `VALIDATION`.

### Global exception filter

- Single `@Catch()` filter catches all exceptions.
- Four-level fallback: domain error → Prisma error → HttpException → unknown.
- Internal errors (infra/unknown) never expose details to clients.
- Logs via `LoggerService` with structured fields.
- Tracks error metrics via Prometheus counter.
- Sentry capture when enabled.

---

## Configuration

- Each config defined with `registerAs('configKey', factory)` from `@nestjs/config`.
- Config validated at startup using a validator class with `class-validator` decorators.
- Config has a corresponding interface that the factory returns.
- Injected with `@Inject(config.KEY)` typed as `ConfigType<typeof config>`.

```ts
export const appConfig = registerAs<AppConfig, ConfigFactory<AppConfigInterface>>(
  'appConfig',
  (): AppConfigInterface => {
    const config = validateConfig(AppConfig);
    return { appPort: config.APP_PORT, ... };
  },
);
```

---

## Cache

- All cache operations are in `CacheStorage` (wraps Redis).
- Every method has a `try/catch` that logs a warning on failure — cache errors never propagate to callers.
- Cache keys defined in a static class with static methods per key type.
- Key naming pattern: `resource:id`, `resource:userId:*` (for pattern invalidation).

```ts
export class TodosCacheKeys {
  static todo(id: string): string { return `todo:${id}`; }
  static todos(userId: string, query: TodosQueryDto): string { return `todos:${userId}:${...}`; }
  static todosByUser(userId: string): string { return `todos:${userId}:*`; }
}
```

Cache invalidation pattern in services:

1. On create/update/delete: invalidate related keys via `del` or `delByPattern`.
2. On read: check cache first; on miss, fetch, then `set`.

---

## Logging

- `LoggerService` wraps pino. All logging goes through it.
- Log methods accept a structured `Message` object:

```ts
this.loggerService.warn({ ctx: CacheStorage.name, msg: 'Cache del failed for key "..."' });
this.loggerService.error({ code, ctx, details, method, msg, path, stack });
```

- `ctx` field always set to the calling class name (use `ClassName.name`).
- Sensitive fields (`authorization`, `cookie`, `password`, `token`) are redacted automatically.

---

## Guards and Interceptors

- `@Injectable()` on all guards and interceptors.
- Implement the corresponding NestJS interface (`CanActivate`, `NestInterceptor`).
- Reusable and focused — one concern per guard/interceptor.

---

## Testing

### Structure

- Negative test cases first, positive test cases after, in separate `describe` blocks separated by a blank line.
- Descriptive test names that explain the behavior, not the implementation.

```ts
describe('TodosService', () => {
  describe('negative cases', () => {
    it('throws TodoNotFoundError when todo does not exist', async () => {});
  });

  describe('positive cases', () => {
    it('returns cached todo without querying repository', async () => {});
  });
});
```

### Setup

- Use `Test.createTestingModule` from `@nestjs/testing`.
- Call `jest.clearAllMocks()` in `beforeEach`.
- Inject real implementations where practical; substitute external dependencies with mocks via `useValue`.

### Mocks

- Shared mocks live in `src/mocks/` and are reused across spec files.
- Mock objects are plain objects with `jest.fn()` for each method — no class mocking or `jest.spyOn`.

```ts
export const prismaMock = {
  $transaction: jest.fn(),
  todo: { create: jest.fn(), delete: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
};
```

### Assertions

- Use `rejects.toBeInstanceOf(ErrorClass)` for typed error checks.
- Use `rejects.toMatchObject({ details: { id: '...' } })` to assert error payload.
- Prefer `toBe` for reference/primitive equality, `toEqual` for deep equality.
- Verify side effects explicitly (e.g. `expect(mock.del).toHaveBeenCalledWith(...)`).

---

## Base Classes

- Prefixed with `_base.` (e.g. `_base.error.ts`, `_base.client.ts`).
- Add `// eslint-disable-next-line @check-file/filename-naming-convention` at the top of the file.
- Used only for true inheritance hierarchies — prefer composition otherwise.

---

## Enums

- Keys in `SCREAMING_SNAKE_CASE`.
- String values in `camelCase` or `lowercase` to match DB/API conventions.
- Each enum in its own file or grouped by domain (e.g. `queries.enum.ts`).

---

## Constants

- Grouped by concern in dedicated files (e.g. `url.constants.ts`).
- Named with `SCREAMING_SNAKE_CASE`.

---

## Skip

- Generated files ./database-manager/generated/\*\*
- Changed _-lock, _.lock files

---

## Reviewer Checklist

Use this checklist when reviewing a pull request against this codebase.

### Structure & Architecture

- [ ] Files placed in the correct layer (`api/` for controllers/DTOs, `features/` for business logic, `modules/` for infrastructure)
- [ ] No business logic inside controllers
- [ ] No direct database access outside repositories
- [ ] No circular dependencies introduced between modules
- [ ] New module exports only what consumers need

### TypeScript

- [ ] No `any` — use `unknown`, generics, or explicit types
- [ ] `import type` used for type-only imports
- [ ] Explicit return types on all public methods
- [ ] `readonly` on injected dependencies and non-mutated fields
- [ ] `type` preferred over `interface` for data shapes
- [ ] Class members ordered alphabetically (properties before methods)

### Naming & Files

- [ ] File names in `kebab-case` with correct role suffix
- [ ] Spec file co-located with the file it tests
- [ ] Base classes prefixed `_base.` with eslint-disable comment on line 1
- [ ] Enums keys in `SCREAMING_SNAKE_CASE`
- [ ] Constants in dedicated files, named `SCREAMING_SNAKE_CASE`

### Controllers

- [ ] Controller is thin — delegates entirely to service
- [ ] `@Controller({ path, version })` used for versioned routes
- [ ] Method decorator order: `@ApiErrors` → `@ApiOk/@ApiPaginated/@ApiEmpty` → HTTP verb → `@UseGuards`
- [ ] Responses mapped with `plainToInstance(Dto, result, { excludeExtraneousValues: true })`

### DTOs

- [ ] Request DTOs use `class-validator` decorators for all fields
- [ ] Response DTOs use `@Expose()` on every field
- [ ] Nested response DTOs use `@Type(() => NestedDto)`
- [ ] Boolean query params use `@Transform` for string-to-boolean conversion
- [ ] Numeric query params use `@Type(() => Number)` with `@IsInt()`
- [ ] All query fields marked `@IsOptional()`
- [ ] All public DTO fields documented with `@ApiProperty` / `@ApiPropertyOptional`

### Entities & Mappers

- [ ] Entities are plain classes with no NestJS or Prisma decorators
- [ ] Entity constructor uses `Object.assign(this, partial)`
- [ ] Mapper is a static class — no instantiation
- [ ] Prisma types imported with `import type`

### Error Handling

- [ ] Domain errors extend `BaseError<TDetails>` with static `code`, `domain`, `message`, `status`
- [ ] Services throw typed domain errors, not raw `Error` or strings
- [ ] Repositories return `void`/`undefined` for not-found instead of throwing
- [ ] Internal error details are never exposed to clients
- [ ] New error codes added to `ErrorCodes` enum, categories to `ErrorCategory` enum

### Cache

- [ ] Cache keys defined as static methods in a `*CacheKeys` class
- [ ] `CacheStorage` used for all Redis operations — no direct Redis access in services
- [ ] Cache invalidated on every mutation (create/update/delete)
- [ ] Cache-aside pattern followed: check → miss → fetch → store

### Logging

- [ ] All logs go through `LoggerService`, not `console.*`
- [ ] Every log call includes `ctx: ClassName.name` and `msg`
- [ ] No sensitive data logged (auth tokens, passwords, cookies)

### Testing

- [ ] Negative test cases in their own `describe('negative cases')` block, placed first
- [ ] Positive test cases in their own `describe('positive cases')` block, placed after
- [ ] Empty line between the two describe blocks
- [ ] `jest.clearAllMocks()` called in `beforeEach`
- [ ] Shared mocks imported from `src/mocks/`, not redefined inline
- [ ] Side effects asserted explicitly (`toHaveBeenCalledWith`)
- [ ] No test depends on execution order of other tests

### General

- [ ] No unrelated code reformatted or refactored
- [ ] No new abstractions introduced without a concrete need
- [ ] Comments added only where the "why" is non-obvious
- [ ] Generated files not manually edited (`database-manager/generated/**`)
- [ ] Lock files not manually edited
