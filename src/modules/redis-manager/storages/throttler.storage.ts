import { ThrottlerStorageRedis, ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import Redis from 'ioredis';

/**
 * Hybrid Storage: Redis + Memory Fallback
 * */
export class ThrottlerStorage implements ThrottlerStorageRedis {
  private memory = new Map<string, ThrottlerStorageRecord>();
  private readonly redisStorage: null | ThrottlerStorageRedisService = null;

  constructor(public redis: Redis) {
    this.redisStorage = new ThrottlerStorageRedisService(redis);
  }

  fallback(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): ThrottlerStorageRecord {
    const now = Date.now();
    const record = this.memory.get(key);

    // If record was expired
    if (!record || record.timeToExpire <= now) {
      const newRecord = {
        isBlocked: false,
        throttlerName,
        timeToBlockExpire: 0,
        timeToExpire: now + ttl,
        totalHits: 1,
      };

      this.memory.set(key, newRecord);

      return newRecord;
    }

    // If record was blocked
    if (record.isBlocked) {
      if (record.timeToBlockExpire > now) {
        return record;
      }
      // block expired → reset
      record.isBlocked = false;
      record.totalHits = 0;
    }

    record.totalHits++;

    // If the limit is exceeded, need to block it
    if (record.totalHits > limit) {
      record.isBlocked = true;
      record.timeToBlockExpire = now + blockDuration;
    }

    return record;
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    // Try to connect to the Redis
    if (this.redisStorage) {
      try {
        return await this.redisStorage.increment(key, ttl, limit, blockDuration, throttlerName);
      } catch {}
    }

    // In-memory fallback
    return this.fallback(key, ttl, limit, blockDuration, throttlerName);
  }
}
