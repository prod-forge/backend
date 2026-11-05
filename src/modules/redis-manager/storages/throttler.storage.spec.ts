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

      it('keeps the block for its full duration after the hit window has expired', () => {
        storage.fallback('ip', 60000, 2, 60000, 'default');
        jest.advanceTimersByTime(1000);
        storage.fallback('ip', 60000, 2, 60000, 'default');
        jest.advanceTimersByTime(49000);
        storage.fallback('ip', 60000, 2, 60000, 'default');
        jest.advanceTimersByTime(11000);

        const result = storage.fallback('ip', 60000, 2, 60000, 'default');

        expect(result).toEqual({ isBlocked: true, timeToBlockExpire: 49, timeToExpire: 60, totalHits: 1 });
      });

      it('blocks again when the block ends while the window is still over the limit', () => {
        for (let i = 0; i < 3; i++) {
          storage.fallback('ip', 60000, 2, 30000, 'default');
        }
        jest.advanceTimersByTime(30001);

        const result = storage.fallback('ip', 60000, 2, 30000, 'default');

        expect(result).toEqual({ isBlocked: true, timeToBlockExpire: 30, timeToExpire: 30, totalHits: 4 });
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

      it('lets the client through once both the block and the window have run out', () => {
        for (let i = 0; i < 3; i++) {
          storage.fallback('ip', 30000, 2, 60000, 'default');
        }
        jest.advanceTimersByTime(60001);

        const result = storage.fallback('ip', 30000, 2, 60000, 'default');

        expect(result).toEqual({ isBlocked: false, timeToBlockExpire: 0, timeToExpire: 30, totalHits: 1 });
      });

      it('starts over at once when the block duration is zero', () => {
        for (let i = 0; i < 2; i++) {
          storage.fallback('ip', 60000, 2, 0, 'default');
        }

        const result = storage.fallback('ip', 60000, 2, 0, 'default');

        expect(result).toEqual({ isBlocked: false, timeToBlockExpire: 0, timeToExpire: 60, totalHits: 1 });
      });

      it('drops records whose window and block have expired on the next sweep', () => {
        storage.fallback('short', 1000, 10, 1000, 'default');
        storage.fallback('blocked', 1000, 0, 120000, 'default');
        jest.advanceTimersByTime(60000);

        storage.fallback('fresh', 60000, 10, 30000, 'default');

        expect(storage.size).toBe(2);
      });

      it('does not sweep more often than once a minute', () => {
        storage.fallback('first', 60000, 10, 30000, 'default');
        storage.fallback('short', 1000, 10, 1000, 'default');
        jest.advanceTimersByTime(59000);

        storage.fallback('second', 60000, 10, 30000, 'default');

        expect(storage.size).toBe(3);
      });

      it('counts different throttlers separately', () => {
        storage.fallback('ip', 60000, 10, 30000, 'default');

        const result = storage.fallback('ip', 60000, 10, 30000, 'login');

        expect(result.totalHits).toBe(1);
      });
    });
  });
});
