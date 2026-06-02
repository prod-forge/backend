# Developer Guide

## Prerequisites

| Tool       | Version  | Notes                      |
| ---------- | -------- | -------------------------- |
| Node.js    | ≥ 24.0.0 | Enforced in `package.json` |
| npm        | ≥ 11.0.0 | Enforced in `package.json` |
| Docker     | any      | For local infra            |
| PostgreSQL | 18       | Or via docker-compose      |
| Redis      | 8        | Or via docker-compose      |

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start infrastructure

```bash
docker-compose up -d database cache
```

This starts:

- PostgreSQL on `localhost:5332`
- Redis on `localhost:6379`

### 3. Configure environment

The app loads `.env.common` first, then `.env`. Both files are committed with safe defaults for local dev.

Key variables to verify:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5332       # Docker-mapped port
DATABASE_USER=user
DATABASE_PASSWORD=user
DATABASE_NAME=app

REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Run migrations and generate Prisma client

```bash
npm run db:init
```

This runs `prisma migrate deploy` then `prisma generate`.

### 5. Start the dev server

```bash
npm run start:dev        # watch mode
npm run start:debug      # watch + Node debugger on port 9229
npm run start            # single run (no watch)
```

App starts on `http://localhost:3000` by default.

### 6. Open Swagger

```
http://localhost:3000/docs
```

Use the Bearer auth input to authenticate. The value is `base64(<userId>)`, e.g.:

```bash
echo -n "your-uuid-here" | base64
```

---

## Environment Variables

All variables are validated at startup with `class-validator`. Missing required vars crash the process with a clear error.

| Variable                          | Default                           | Description                                       |
| --------------------------------- | --------------------------------- | ------------------------------------------------- |
| `NODE_ENV`                        | `development`                     | `development` \| `production` \| `test`           |
| `APP_PORT`                        | `3000`                            | HTTP listen port                                  |
| `APP_HOST`                        | `0.0.0.0`                         | HTTP listen host                                  |
| `APP_NAME`                        | `Todo_inst1`                      | Used in logs and Swagger title                    |
| `API_PREFIX`                      | `api`                             | Global route prefix                               |
| `API_ALLOWED_ORIGINS`             | `["http://localhost:3001"]`       | JSON array of allowed CORS origins                |
| `API_ALLOWED_NON_BROWSER_ORIGINS` | `true`                            | Allow requests with no `Origin` header            |
| `LOG_LEVEL`                       | `info`                            | `trace` \| `debug` \| `info` \| `warn` \| `error` |
| `LOG_PRETTY`                      | `true`                            | Enable pino-pretty colored output                 |
| `SWAGGER_ENABLED`                 | `true`                            | Toggle Swagger UI (disabled in production)        |
| `SWAGGER_ENDPOINT`                | `/docs`                           | Swagger UI path                                   |
| `DATABASE_HOST`                   | —                                 | PostgreSQL host                                   |
| `DATABASE_PORT`                   | —                                 | PostgreSQL port                                   |
| `DATABASE_USER`                   | —                                 | PostgreSQL username                               |
| `DATABASE_PASSWORD`               | —                                 | PostgreSQL password                               |
| `DATABASE_NAME`                   | —                                 | PostgreSQL database name                          |
| `DATABASE_SSL`                    | `false`                           | Enable SSL for DB connection                      |
| `DATABASE_LOG_LEVELS`             | `["query","error","info","warn"]` | Prisma log levels                                 |
| `DATABASE_FAIL_FAST`              | `true`                            | Exit on DB connection failure at startup          |
| `REDIS_ENABLED`                   | `true`                            | Enable Redis (cache + throttler)                  |
| `REDIS_HOST`                      | `localhost`                       | Redis host                                        |
| `REDIS_PORT`                      | `6379`                            | Redis port                                        |
| `THROTTLE_TTL`                    | `20000`                           | Rate-limit window in milliseconds                 |
| `THROTTLE_LIMIT`                  | `10`                              | Max requests per window                           |
| `SENTRY_ENABLED`                  | `false`                           | Enable Sentry error capture                       |
| `SENTRY_DSN`                      | —                                 | Sentry DSN (required when enabled)                |
| `HEALTH_CHECK_TRIGGER_MS`         | `15000`                           | Health metric refresh interval                    |

---

## Scripts

```bash
# Development
npm run start:dev          # Start with file watch
npm run start:debug        # Start with debugger

# Build & Production
npm run build              # Compile to dist/
npm run start:prod         # Run compiled output

# Database
npm run db:generate        # Regenerate Prisma client
npm run db:init            # Deploy migrations + generate
npm run db:migrate -- name # Create a new migration
npm run db:seed            # Run seed script

# Code quality
npm run lint               # TypeScript + ESLint check
npm run lint:ts            # tsc --noEmit only
npm run lint:code          # ESLint only
npm run format             # Prettier + ESLint auto-fix
npm run knip               # Dead code / unused exports check

# Testing
npm test                   # Unit tests
npm run test:cov           # Unit tests with coverage
npm run test:watch         # Unit tests in watch mode
npm run test:e2e           # E2E tests (Testcontainers)
npm run test:e2e:cov       # E2E with coverage
```

---

## Testing

### Unit tests

Located co-located with source files as `*.spec.ts`. Run with Jest + ts-jest.

```bash
npm test
# Run a single file:
npx jest src/features/todos/todos.service.spec.ts
```

Test mocks are shared from `src/mocks/`:

- `prismaMock` — fakes all Prisma model methods
- `cacheStorageMock` — fakes all `CacheStorage` methods

### E2E tests

Located in `test/`. Use `@testcontainers/postgresql` and `@testcontainers/redis` — real Docker containers are spun up per suite. Requires Docker.

```bash
npm run test:e2e
```

### Coverage exclusions

The following are excluded from coverage (see `jest.collectCoverageFrom` in `package.json`):

- `main.ts`, `app.setup.ts`, `app.swagger.ts`
- `*.module.ts`, `*.spec.ts`
- `*.config.ts`, `*.interface.ts`, `*.enum.ts`, `*.dto.ts`, `*.entity.ts`
- DI type files, constants files

---

## Adding a New Feature

Follow this sequence to stay consistent with existing patterns.

### 1. Domain errors

Create `src/error-handler/errors/<feature>.errors.ts`:

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
export class FeatureMapper {
  static toEntity(row: PrismaFeature): FeatureEntity {
    return new FeatureEntity({ ... });
  }
}
```

### 4. Repository

`src/features/<feature>/<feature>.repository.ts` — inject `PrismaService`, return entities via mapper, return `void` for not-found.

### 5. Service

`src/features/<feature>/<feature>.service.ts` — inject repository (and `CacheStorage` if caching applies), throw domain errors, coordinate cache invalidation.

### 6. Cache keys (if caching)

`src/features/<feature>/cache-queries/<feature>.cache-queries.ts`:

```ts
export class FeatureCacheKeys {
  static item(id: string): string {
    return `feature:${id}`;
  }
}
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

---

## Database Changes

```bash
# Make changes to database-manager/schema.prisma, then:
npm run db:migrate -- describe-your-change
# This creates a migration file and regenerates the Prisma client.
```

Never edit files in `database-manager/generated/` manually.

---

## Code Quality Gates

The following run automatically via husky/lint-staged on every commit:

- `prettier` — format check
- `eslint` — lint (includes import-order, perfectionist, sonarjs, unicorn, check-file rules)
- `tsc --noEmit` — type check
- `commitlint` — enforces Conventional Commits format

To run all checks manually:

```bash
npm run lint && npm run format
```

---

## Docker

### Build and run locally

```bash
docker-compose up --build production
```

The `Dockerfile` uses a two-stage build:

1. **builder** — installs all deps, generates Prisma client, compiles TypeScript
2. **production** — copies only compiled output and prod deps, runs as unprivileged `nodeuser`

### Full observability stack

```bash
docker-compose up -d
```

Starts: app · PostgreSQL · Redis · Prometheus · Grafana · Loki · Promtail

- Grafana: `http://localhost:3001` (admin/admin)
- Prometheus: `http://localhost:9090`

---

## Logging

The app uses structured JSON logging via pino. In development, `LOG_PRETTY=true` enables human-readable output.

Every log entry includes:

- `timestamp` — ISO 8601
- `level` — trace/debug/info/warn/error
- `traceId` — from the request context (UUID set per request)
- `ctx` — the class name that produced the log
- `msg` — log message
- `appName`, `env`, `pid` — process metadata

Sensitive fields automatically redacted: `authorization`, `cookie`, `password`, `token`.

---

## Release

Releases follow Conventional Commits and are managed with `release-it`:

```bash
npm run release
```

This bumps the version, generates a changelog, and tags the commit.
