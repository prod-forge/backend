import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { execSync } from 'child_process';

export default async function (): Promise<void> {
  const dbContainer = await new PostgreSqlContainer('postgres:latest')
    .withDatabase('test')
    .withUsername('test')
    .withPassword('test')
    .start();
  const redisContainer = await new RedisContainer('redis:latest').start();

  process.env.DATABASE_NAME = dbContainer.getName().slice(1);
  process.env.DATABASE_PORT = dbContainer.getPort().toString();
  process.env.DATABASE_USER = dbContainer.getUsername();
  process.env.DATABASE_PASSWORD = dbContainer.getPassword();
  process.env.DATABASE_HOST = dbContainer.getHost();

  process.env.REDIS_HOST = redisContainer.getHost();
  process.env.REDIS_PORT = redisContainer.getPort().toString();

  (global as never as { __POSTGRES_CONTAINER__: StartedPostgreSqlContainer }).__POSTGRES_CONTAINER__ = dbContainer;
  (global as never as { __REDIS_CONTAINER__: StartedRedisContainer }).__REDIS_CONTAINER__ = redisContainer;

  execSync(`npx prisma migrate reset --force`, {
    stdio: 'inherit',
  });
  execSync(`prisma db seed`, {
    stdio: 'inherit',
  });
}
