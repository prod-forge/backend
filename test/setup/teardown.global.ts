import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { StartedRedisContainer } from '@testcontainers/redis';

export default async function (): Promise<void> {
  const dbContainer = (global as unknown as { __POSTGRES_CONTAINER__: StartedPostgreSqlContainer })
    .__POSTGRES_CONTAINER__;
  const redisContainer = (global as unknown as { __REDIS_CONTAINER__: StartedRedisContainer }).__REDIS_CONTAINER__;

  if (dbContainer) {
    await dbContainer.stop();
  }
  if (redisContainer) {
    await redisContainer.stop();
  }
}
