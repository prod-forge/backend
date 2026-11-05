import type { ThrottlerStorage } from '@nestjs/throttler';
import type Redis from 'ioredis';

import { Injectable } from '@nestjs/common';

import { ThrottlerRedis } from '../clients/throttler.client';

export type ThrottlerStorageRecord = Awaited<ReturnType<ThrottlerStorage['increment']>>;

// One atomic round trip per request: count the hit, start its window, set or read the block.
// Adapted from @nest-lab/throttler-storage-redis (MIT), which took it from rate-limit-redis by wyattjoh.
const INCREMENT_SCRIPT = `
local hitKey = KEYS[1]
local blockKey = KEYS[2]
local ttl = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local blockDuration = tonumber(ARGV[3])

local totalHits = redis.call('INCR', hitKey)
local timeToExpire = redis.call('PTTL', hitKey)

if timeToExpire <= 0 then
  redis.call('PEXPIRE', hitKey, ttl)
  timeToExpire = ttl
end

local isBlocked = redis.call('GET', blockKey)
local timeToBlockExpire = 0

if isBlocked then
  timeToBlockExpire = redis.call('PTTL', blockKey)
elseif totalHits > limit then
  redis.call('SET', blockKey, 1, 'PX', blockDuration)
  isBlocked = '1'
  timeToBlockExpire = blockDuration
end

if isBlocked and timeToBlockExpire <= 0 then
  redis.call('DEL', blockKey)
  redis.call('SET', hitKey, 1, 'PX', ttl)
  totalHits = 1
  timeToExpire = ttl
  isBlocked = false
end

return { totalHits, timeToExpire, isBlocked and 1 or 0, timeToBlockExpire }
`;

const isNumberTuple = (value: unknown): value is [number, number, number, number] =>
  Array.isArray(value) && value.length === 4 && value.every((item) => typeof item === 'number');

/**
 * Redis storage for @nestjs/throttler. Times are passed in milliseconds and returned in seconds,
 * which is what the guard writes into the Retry-After and X-RateLimit-Reset headers.
 */
@Injectable()
export class ThrottlerRedisStorage implements ThrottlerStorage {
  private readonly redis: Redis;

  constructor(throttlerRedis: ThrottlerRedis) {
    this.redis = throttlerRedis.getClient();
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    // The hash tag keeps both keys in one slot, so the script also works on a Redis Cluster
    const hitKey = `{${key}:${throttlerName}}:hits`;
    const blockKey = `{${key}:${throttlerName}}:blocked`;

    const result = await this.redis.eval(INCREMENT_SCRIPT, 2, hitKey, blockKey, ttl, limit, blockDuration);

    if (!isNumberTuple(result)) {
      throw new TypeError(`Unexpected throttler script result: ${JSON.stringify(result)}`);
    }

    const [totalHits, timeToExpire, isBlocked, timeToBlockExpire] = result;

    return {
      isBlocked: isBlocked === 1,
      timeToBlockExpire: Math.ceil(timeToBlockExpire / 1000),
      timeToExpire: Math.ceil(timeToExpire / 1000),
      totalHits,
    };
  }
}
