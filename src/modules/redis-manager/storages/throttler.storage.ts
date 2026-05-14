import type { ThrottlerStorageRedis } from '@nest-lab/throttler-storage-redis';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import type { Cluster } from 'ioredis';
import type Redis from 'ioredis';

import { Injectable } from '@nestjs/common';

import { ThrottlerRedisStorage } from './throttler-redis.storage';

/**
 * Hybrid Storage: Redis + Memory Fallback
 * */
@Injectable()
export class ThrottlerStorage implements ThrottlerStorageRedis {
  get redis(): Cluster | Redis {
    return this.redisStorage.redis;
  }

  private memory = new Map<string, ThrottlerStorageRecord>();

  constructor(private readonly redisStorage: ThrottlerRedisStorage) {}

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
    try {
      return await this.redisStorage.increment(key, ttl, limit, blockDuration, throttlerName);
    } catch {}

    // In-memory fallback
    return this.fallback(key, ttl, limit, blockDuration, throttlerName);
  }
}
