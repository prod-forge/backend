import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { LoggerService } from '../../../logger/logger.service';
import { RedisManagerService } from '../redis-manager.service';
import { cacheOperationsTotal } from './cache.metrics';

const SCAN_COUNT = 100;

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
      cacheOperationsTotal.inc({ operation: 'del', result: 'ok' });
    } catch {
      cacheOperationsTotal.inc({ operation: 'del', result: 'error' });
      this.loggerService.warn({ ctx: CacheStorage.name, msg: `Cache del failed for key "${key}"` });
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    try {
      // scanStream does not apply ioredis keyPrefix to MATCH, but returns full keys; unlink re-applies the prefix
      const prefix = this.redis.options.keyPrefix ?? '';
      const stream = this.redis.scanStream({ count: SCAN_COUNT, match: `${prefix}${pattern}` });

      for await (const batch of stream as AsyncIterable<string[]>) {
        if (batch.length) {
          await this.redis.unlink(...batch.map((key) => key.slice(prefix.length)));
        }
      }
    } catch {
      this.loggerService.warn({ ctx: CacheStorage.name, msg: `Cache delByPattern failed for pattern "${pattern}"` });
    }
  }

  async get<T>(key: string): Promise<null | T> {
    try {
      const data = await this.redis.get(key);

      if (!data) {
        cacheOperationsTotal.inc({ operation: 'get', result: 'miss' });

        return null;
      }

      const parsed = JSON.parse(data) as T;
      cacheOperationsTotal.inc({ operation: 'get', result: 'hit' });

      return parsed;
    } catch {
      cacheOperationsTotal.inc({ operation: 'get', result: 'error' });
      this.loggerService.warn({ ctx: CacheStorage.name, msg: `Cache get failed for key "${key}"` });
    }

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

      cacheOperationsTotal.inc({ operation: 'set', result: 'ok' });
    } catch {
      cacheOperationsTotal.inc({ operation: 'set', result: 'error' });
      this.loggerService.warn({ ctx: CacheStorage.name, msg: `Cache set failed for key "${key}"` });
    }
  }
}
