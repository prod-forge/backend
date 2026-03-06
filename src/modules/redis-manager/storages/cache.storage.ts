import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { LoggerService } from '../../../logger/logger.service';
import { RedisManagerService } from '../redis-manager.service';

@Injectable()
export class CacheStorage {
  private readonly redis: Redis;

  constructor(
    private readonly redisManager: RedisManagerService,
    private readonly loggerService: LoggerService,
  ) {
    this.redis = this.redisManager.getCacheRedis();
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {}
  }

  async delByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length) {
        await this.redis.del(keys);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {}
  }

  async get<T>(key: string): Promise<null | T> {
    try {
      const data = await this.redis.get(key);

      return data ? (JSON.parse(data) as T) : null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {}

    return null;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const data = JSON.stringify(value);

      if (ttlSeconds) {
        await this.redis.set(key, data, 'EX', ttlSeconds);
      } else {
        await this.redis.set(key, data);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {}
  }
}
