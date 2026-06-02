# Database Schema

**Engine:** PostgreSQL 18  
**ORM:** Prisma 7 (client generated to `database-manager/generated/`)  
**Schema file:** `database-manager/schema.prisma`

---

## Models

### `User`

Represents an application user. Currently populated externally (no registration endpoint).
The `AuthGuard` decodes the Bearer token to obtain a `userId`, which must exist in this table.

```prisma
model User {
  id        String   @id @default(uuid()) @db.Uuid()
  email     String   @unique
  name      String
  todos     Todo[]
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt

  @@index([createdAt])
}
```

| Column      | Type          | Constraints            | Description                                                           |
| ----------- | ------------- | ---------------------- | --------------------------------------------------------------------- |
| `id`        | `UUID`        | PK, auto (`uuid()`)    | Stable surrogate key. Used as the authenticated identity in requests. |
| `email`     | `VARCHAR`     | UNIQUE, NOT NULL       | User's email address. Unique constraint prevents duplicate accounts.  |
| `name`      | `VARCHAR`     | NOT NULL               | Display name shown in todo responses as `userName`.                   |
| `todos`     | relation      | —                      | Virtual back-reference — not a column; owned todos resolved via FK.   |
| `createdAt` | `TIMESTAMPTZ` | NOT NULL, default now  | Record creation time. Indexed for time-range queries and sorting.     |
| `updatedAt` | `TIMESTAMPTZ` | NOT NULL, auto-updated | Automatically bumped on every `UPDATE` via Prisma `@updatedAt`.       |

**Indexes**

| Index                | Columns     | Rationale                                      |
| -------------------- | ----------- | ---------------------------------------------- |
| `User_createdAt_idx` | `createdAt` | Supports listing users sorted by creation date |

---

### `Todo`

A todo item owned by one user. Core domain entity of the application.

```prisma
model Todo {
  id          String   @id @default(uuid()) @db.Uuid()
  title       String
  description String?
  completed   Boolean  @default(false)
  userId      String   @db.Uuid
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @default(now()) @updatedAt

  @@index([userId, createdAt])
  @@index([userId, completed, createdAt])
}
```

| Column        | Type          | Constraints               | Description                                                                                   |
| ------------- | ------------- | ------------------------- | --------------------------------------------------------------------------------------------- |
| `id`          | `UUID`        | PK, auto (`uuid()`)       | Stable surrogate key. Returned in all API responses as the todo identifier.                   |
| `title`       | `VARCHAR`     | NOT NULL                  | Main label of the todo. Searchable and sortable.                                              |
| `description` | `VARCHAR`     | NULL                      | Optional extended notes. `null` when not provided; `nullable: true` in response DTOs.         |
| `completed`   | `BOOLEAN`     | NOT NULL, default `false` | Completion flag. Defaults to `false` on creation. Filterable via `?completed=true/false`.     |
| `userId`      | `UUID`        | NOT NULL, FK → `User.id`  | Owner reference. Every todo belongs to exactly one user. Set from the Bearer token on create. |
| `user`        | relation      | —                         | Virtual join — not a column; resolves to the parent `User` row via `userId`.                  |
| `createdAt`   | `TIMESTAMPTZ` | NOT NULL, default now     | Record creation time. Part of composite indexes; used for stable sort order.                  |
| `updatedAt`   | `TIMESTAMPTZ` | NOT NULL, auto-updated    | Automatically bumped on every `UPDATE`. Useful for audit/sync scenarios.                      |

**Indexes**

| Index                                 | Columns                          | Rationale                                                                              |
| ------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| `Todo_userId_createdAt_idx`           | `(userId, createdAt)`            | Covers the default list query: all todos for a user ordered by creation date.          |
| `Todo_userId_completed_createdAt_idx` | `(userId, completed, createdAt)` | Covers filtered list query: todos for a user filtered by `completed`, ordered by date. |

---

## Relationships

```
User 1 ──── * Todo
  (id)       (userId FK)
```

- One `User` can have many `Todo`s.
- Deleting a `User` without first deleting their `Todo`s will violate the FK constraint (no cascade delete configured).

---

## Migrations

Managed with Prisma Migrate.

| Command                        | Description                                        |
| ------------------------------ | -------------------------------------------------- |
| `npm run db:migrate -- <name>` | Create and apply a new migration in dev            |
| `npm run db:migration:apply`   | Wait for DB then deploy existing migrations (prod) |
| `npm run db:generate`          | Regenerate the Prisma client after schema changes  |
| `npm run db:seed`              | Run the seed script (`prisma/seed.ts`)             |

Migration files live in `database-manager/migrations/`.

---

## Connection

Connection string is assembled at runtime from individual environment variables by `database-manager/generate-url.ts`:

```
postgresql://<DATABASE_USER>:<DATABASE_PASSWORD>@<DATABASE_HOST>:<DATABASE_PORT>/<DATABASE_NAME>
```

SSL is controlled by `DATABASE_SSL`. Log levels for Prisma query logging are set via `DATABASE_LOG_LEVELS`.

`DATABASE_FAIL_FAST=true` causes the app to exit on startup if the database is unreachable.
