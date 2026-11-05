import type { ThrottlerStorage as ThrottlerStorageContract } from '@nestjs/throttler';

import { Injectable } from '@nestjs/common';

import { ThrottlerRedisStorage, type ThrottlerStorageRecord } from './throttler-redis.storage';

// The hit window and the block expire independently, like the two keys of the Redis script
type MemoryRecord = {
  blockExpiresAt: number;
  hitsExpireAt: number;
  totalHits: number;
};

// How often the fallback drops records whose window and block have both expired
const SWEEP_INTERVAL_MS = 60_000;

const secondsUntil = (timestamp: number, now: number): number => Math.max(0, Math.ceil((timestamp - now) / 1000));

/**
 * Hybrid Storage: Redis + Memory Fallback
 * */
@Injectable()
export class ThrottlerStorage implements ThrottlerStorageContract {
  // Number of keys the fallback currently holds
  get size(): number {
    return this.memory.size;
  }
  private readonly memory = new Map<string, MemoryRecord>();

  private nextSweepAt = 0;

  constructor(private readonly redisStorage: ThrottlerRedisStorage) {}

  // Mirrors INCREMENT_SCRIPT step by step: times in milliseconds in, remaining seconds out
  fallback(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): ThrottlerStorageRecord {
    const now = Date.now();
    this.sweep(now);

    const memoryKey = `${key}:${throttlerName}`;
    const record = this.memory.get(memoryKey) ?? { blockExpiresAt: 0, hitsExpireAt: 0, totalHits: 0 };
    this.memory.set(memoryKey, record);

    // INCR + PEXPIRE: an expired window counts as a missing key and starts a new one
    if (record.hitsExpireAt <= now) {
      record.hitsExpireAt = now + ttl;
      record.totalHits = 0;
    }
    record.totalHits++;

    // GET blockKey: an existing block keeps its own expiry, whatever happens to the window
    let isBlocked = record.blockExpiresAt > now;
    let timeToBlockExpire = 0;

    if (isBlocked) {
      timeToBlockExpire = record.blockExpiresAt - now;
    } else if (record.totalHits > limit) {
      record.blockExpiresAt = now + blockDuration;
      isBlocked = true;
      timeToBlockExpire = blockDuration;
    }

    if (isBlocked && timeToBlockExpire <= 0) {
      record.blockExpiresAt = 0;
      record.hitsExpireAt = now + ttl;
      record.totalHits = 1;
      isBlocked = false;
    }

    return {
      isBlocked,
      timeToBlockExpire: isBlocked ? secondsUntil(record.blockExpiresAt, now) : 0,
      timeToExpire: secondsUntil(record.hitsExpireAt, now),
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

  // Redis expires keys on its own; the fallback has to drop dead records itself or the map grows for the whole outage
  private sweep(now: number): void {
    if (now < this.nextSweepAt) {
      return;
    }

    this.nextSweepAt = now + SWEEP_INTERVAL_MS;

    for (const [memoryKey, record] of this.memory) {
      if (record.hitsExpireAt <= now && record.blockExpiresAt <= now) {
        this.memory.delete(memoryKey);
      }
    }
  }
}
