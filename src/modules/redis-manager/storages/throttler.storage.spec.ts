import type { ThrottlerRedisStorage, ThrottlerStorageRecord } from './throttler-redis.storage';

import { ThrottlerStorage } from './throttler.storage';

const makeRedisStorage = (): jest.Mocked<ThrottlerRedisStorage> =>
  ({
    increment: jest.fn(),
  }) as unknown as jest.Mocked<ThrottlerRedisStorage>;

const makeRecord = (overrides: Partial<ThrottlerStorageRecord> = {}): ThrottlerStorageRecord => ({
  isBlocked: false,
  timeToBlockExpire: 0,
  timeToExpire: Date.now() + 10000,
  totalHits: 1,
  ...overrides,
});

describe('ThrottlerStorage', () => {
  let storage: ThrottlerStorage;
  let redisStorage: jest.Mocked<ThrottlerRedisStorage>;

  beforeEach(() => {
    redisStorage = makeRedisStorage();
    storage = new ThrottlerStorage(redisStorage);
  });

  describe('increment', () => {
    describe('negative cases', () => {
      it('falls back to memory when redis throws', async () => {
        redisStorage.increment.mockRejectedValue(new Error('redis down'));

        const result = await storage.increment('key', 60000, 10, 30000, 'default');

        expect(result.totalHits).toBe(1);
        expect(result.isBlocked).toBe(false);
      });
    });

    describe('positive cases', () => {
      it('returns redis result when redis succeeds', async () => {
        const record = makeRecord({ totalHits: 3 });
        redisStorage.increment.mockResolvedValue(record);

        const result = await storage.increment('key', 60000, 10, 30000, 'default');

        expect(result).toBe(record);
      });
    });
  });

  describe('fallback', () => {
    beforeEach(() => {
      jest.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe('negative cases', () => {
      it('blocks the hit that exceeds the limit and reports the block in seconds', () => {
        for (let i = 0; i < 2; i++) {
          storage.fallback('ip', 60000, 2, 30000, 'default');
        }

        const result = storage.fallback('ip', 60000, 2, 30000, 'default');

        expect(result).toEqual({ isBlocked: true, timeToBlockExpire: 30, timeToExpire: 60, totalHits: 3 });
      });

      it('stays blocked while the block lasts', () => {
        for (let i = 0; i < 3; i++) {
          storage.fallback('ip', 60000, 2, 30000, 'default');
        }
        jest.advanceTimersByTime(10000);

        const result = storage.fallback('ip', 60000, 2, 30000, 'default');

        expect(result.isBlocked).toBe(true);
        expect(result.timeToBlockExpire).toBe(20);
      });
    });

    describe('positive cases', () => {
      it('creates a record on the first call with the window in seconds', () => {
        const result = storage.fallback('new-key', 60000, 10, 30000, 'default');

        expect(result).toEqual({ isBlocked: false, timeToBlockExpire: 0, timeToExpire: 60, totalHits: 1 });
      });

      it('increments totalHits on subsequent calls', () => {
        storage.fallback('multi-key', 60000, 10, 30000, 'default');
        storage.fallback('multi-key', 60000, 10, 30000, 'default');

        const result = storage.fallback('multi-key', 60000, 10, 30000, 'default');

        expect(result.totalHits).toBe(3);
      });

      it('starts a new window when the previous one has expired', () => {
        storage.fallback('expired-key', 1000, 10, 30000, 'default');
        jest.advanceTimersByTime(1001);

        const result = storage.fallback('expired-key', 60000, 10, 30000, 'default');

        expect(result.totalHits).toBe(1);
      });

      it('starts over once the block has run out', () => {
        for (let i = 0; i < 3; i++) {
          storage.fallback('ip', 60000, 2, 30000, 'default');
        }
        jest.advanceTimersByTime(30001);

        const result = storage.fallback('ip', 60000, 2, 30000, 'default');

        expect(result).toEqual({ isBlocked: false, timeToBlockExpire: 0, timeToExpire: 60, totalHits: 1 });
      });

      it('counts different throttlers separately', () => {
        storage.fallback('ip', 60000, 10, 30000, 'default');

        const result = storage.fallback('ip', 60000, 10, 30000, 'login');

        expect(result.totalHits).toBe(1);
      });
    });
  });
});
