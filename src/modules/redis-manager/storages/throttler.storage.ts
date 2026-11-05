import type { ThrottlerStorage as ThrottlerStorageContract } from '@nestjs/throttler';

import { Injectable } from '@nestjs/common';

import { ThrottlerRedisStorage, type ThrottlerStorageRecord } from './throttler-redis.storage';

type MemoryRecord = {
  blockExpiresAt: number;
  expiresAt: number;
  isBlocked: boolean;
  totalHits: number;
};

const secondsUntil = (timestamp: number, now: number): number => Math.max(0, Math.ceil((timestamp - now) / 1000));

/**
 * Hybrid Storage: Redis + Memory Fallback
 * */
@Injectable()
export class ThrottlerStorage implements ThrottlerStorageContract {
  private readonly memory = new Map<string, MemoryRecord>();

  constructor(private readonly redisStorage: ThrottlerRedisStorage) {}

  // Same semantics as the Redis script: times in milliseconds in, remaining seconds out
  fallback(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): ThrottlerStorageRecord {
    const now = Date.now();
    const memoryKey = `${key}:${throttlerName}`;
    let record = this.memory.get(memoryKey);

    // No record or its window has passed: start a new window
    if (!record || record.expiresAt <= now) {
      record = { blockExpiresAt: 0, expiresAt: now + ttl, isBlocked: false, totalHits: 0 };
      this.memory.set(memoryKey, record);
    }

    // The block has run out: start over
    if (record.isBlocked && record.blockExpiresAt <= now) {
      record.blockExpiresAt = 0;
      record.expiresAt = now + ttl;
      record.isBlocked = false;
      record.totalHits = 0;
    }

    record.totalHits++;

    // If the limit is exceeded, need to block it
    if (!record.isBlocked && record.totalHits > limit) {
      record.isBlocked = true;
      record.blockExpiresAt = now + blockDuration;
    }

    return {
      isBlocked: record.isBlocked,
      timeToBlockExpire: record.isBlocked ? secondsUntil(record.blockExpiresAt, now) : 0,
      timeToExpire: secondsUntil(record.expiresAt, now),
      totalHits: record.totalHits,
    };
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
