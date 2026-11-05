# Patterns

How to add code so it matches the existing structure. The reference implementation is the todos feature: `src/api/todos/` (transport) and `src/features/todos/` (business logic). Commands are in [../commands.md](../commands.md).

## Adding a New Feature

Follow this sequence to stay consistent with existing patterns.

### 1. Domain errors

Create `src/error-handler/errors/<feature>.errors.ts` (the todos feature uses `todo.errors.ts`):

```ts
export class FeatureNotFoundError extends BaseError<{ id: string }> {
  static code = ErrorCodes.FEATURE_NOT_FOUND;
  static domain = ErrorCategory.DOMAIN;
  static message = 'Feature not found';
  static status = HttpStatus.NOT_FOUND;

  constructor(id: string) {
    super(
      FeatureNotFoundError.message,
      FeatureNotFoundError.code,
      FeatureNotFoundError.domain,
      FeatureNotFoundError.status,
      { id },
    );
  }
}
```

Add `FEATURE_NOT_FOUND` to `ErrorCodes` enum.

### 2. DTOs

Create under `src/api/<feature>/dtos/`:

- `requests/create-<feature>.dto.ts` — `class-validator` + `@ApiProperty`
- `requests/update-<feature>.dto.ts` — all fields optional
- `responses/<feature>-response.dto.ts` — `@Expose()` + `@ApiProperty`

### 3. Entity and mapper

`src/features/<feature>/entities/<feature>.entity.ts`:

```ts
export class FeatureEntity {
  id: string;
  // ... alphabetical

  constructor(partial: Partial<FeatureEntity>) {
    Object.assign(this, partial);
  }
}
```

`src/features/<feature>/mappers/<feature>.mapper.ts`:

```ts
export const FeatureMapper = {
  toEntity(row: PrismaFeature): FeatureEntity {
    return new FeatureEntity({ ... });
  },
};
```

### 4. Repository

`src/features/<feature>/<feature>.repository.ts` — inject `PrismaService`, return entities via mapper, return `void` for not-found.

### 5. Service

`src/features/<feature>/<feature>.service.ts` — inject repository (and `CacheStorage` if caching applies), throw domain errors, coordinate cache invalidation.

### 6. Cache keys (if caching)

`src/features/<feature>/cache-queries/<feature>.cache-queries.ts`:

```ts
const CACHE_VERSION = 'v1'; // bump when the cached shape changes

export const FeatureCacheKeys = {
  item(id: string): string {
    return `${CACHE_VERSION}:feature:${id}`;
  },
};
```

### 7. Controller

`src/api/<feature>/<feature>.controller.ts`:

```ts
@ApiTags('Feature')
@Controller({ path: 'feature', version: '1' })
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @ApiErrors(...)
  @ApiOk(FeatureResponseDto, { ... })
  @Get(':id')
  @UseGuards(AuthGuard)
  async findOne(@Param('id') id: string): Promise<FeatureResponseDto> {
    const item = await this.featureService.findOne(id);
    return plainToInstance(FeatureResponseDto, item, { excludeExtraneousValues: true });
  }
}
```

### 8. Module

`src/features/<feature>/<feature>.module.ts` — wire controller, service, repository, and required imports.

### 9. Register module

Import the new `FeatureModule` in `src/app.module.ts`.

### 10. Tests and contract

- Unit tests: a co-located `*.spec.ts` next to the controller, service, repository, mapper and cache queries, with negative cases first (`AGENTS.md`, "Test Structure"). Shared mocks are in `src/mocks/`.
- E2E tests: `test/<feature>.e2e-spec.ts`.
- HTTP contract: run `npm run openapi:export` and commit `docs/openapi.json`; `npm run openapi:check` (CI) and `test/openapi.e2e-spec.ts` fail when it is out of date. Update [api.md](api.md) in the same change.

---

## Database Changes

```bash
# Make changes to database-manager/schema.prisma, then:
npm run db:migrate -- describe-your-change
# This creates a migration file and regenerates the Prisma client.
```

Never edit files in `database-manager/generated/` manually. Migrations are forward-only (no down migrations, `guide/release-management.md`, "Important Note About Migrations"), so a schema change must not break the version that is still running. Update [data-schema.md](data-schema.md) in the same change.
