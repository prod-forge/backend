# Database Management

<p align="center">
  <img alt="Database Management" src="https://github.com/prod-forge/backend/blob/main/assets/database-management.png" width="510px" height="467px">
</p>

Database management is treated as a separate operational layer inside the application.

Working with a database is not just about connecting an ORM - it includes a set of operational tasks such as:

- generating migrations
- applying migrations
- managing database seeds
- running fixtures
- preparing test environments with fake data

Because of this, database operations are isolated inside a dedicated module.

In this project, all database-related tooling lives inside the database-manager directory located at the root of the
repository.

```shell
database-manager/
```

This module acts as a utility layer responsible for managing the database lifecycle.

## Database Scripts

To make database operations predictable and easy to run, all common database commands are exposed through npm scripts.

```json
{
  "db:generate": "prisma generate",
  "db:init": "prisma migrate deploy && prisma generate",
  "db:migrate": "prisma migrate dev --name",
  "db:migration:apply": "npm run db:wait && npm run db:migration:deploy",
  "db:migration:deploy": "prisma migrate deploy",
  "db:seed": "prisma db seed",
  "db:wait": "tsx ./database-manager/wait-for-db.ts"
}
```

This approach provides several benefits:

- consistent developer workflow
- easier CI/CD integration
- predictable database operations

Instead of remembering long CLI commands, developers interact with the database through simple scripts.

## Database Manager in Docker

The database-manager module is included in the production Docker image.

```dockerfile
COPY --from=builder /app/database-manager ./database-manager
```

This ensures that the application container has access to the tools required to run:

- migrations
- database initialization
- seed operations

## Why Not a Separate Database Service?

A common question is why the database manager is not implemented as a separate Docker service or application.

In practice, this adds complexity without providing real benefits.

Database migrations are tightly coupled to the application version. Running migrations in a completely separate service
introduces versioning problems:

- migrations must match the application version
- rollback strategies become more complex
- coordination between services becomes harder

For this reason, the database manager is bundled with the backend application image.

This ensures that the application and its database schema evolve together.

## Working with Migrations

Database migrations should always be treated as forward-only operations.

Unlike application code, migrations are not easily reversible.

Because of this, migrations should be designed carefully.

Avoid aggressive or destructive schema changes whenever possible.

For example:

Instead of immediately dropping a table or column, it is safer to introduce changes gradually across several releases.

Typical strategy:

1. mark fields as deprecated
2. stop using them in the application
3. remove them in a later release

This approach provides flexibility if something goes wrong during deployment.

If the application needs to be rolled back, the database schema will still remain compatible with the previous version.

In container environments such as AWS ECS, this allows fast rollbacks by simply switching to a previous task revision.

### Running Migrations in CI/CD

Database migrations are executed during the deployment pipeline using a one-run ECS task.

This means a temporary ECS task is launched using the same Docker image as the backend application, but instead of
starting the server it performs a single operation - applying migrations.

In practice, this is equivalent to launching a short-lived container that runs:

```shell
prisma migrate deploy
```

After the migrations are applied, the task exits.

This approach provides several advantages:

- migrations run in the same environment as production
- the exact same Docker image is used
- no manual database access is required
- deployment pipelines remain deterministic

If additional operations are required - for example running database seeds - they can be executed using separate one-run
ECS tasks.

Each operational task remains isolated and predictable.
