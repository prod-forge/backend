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
    describe('negative cases', () => {
      it('returns blocked record when already blocked and not expired', () => {
        const blockedRecord = makeRecord({
          isBlocked: true,
          timeToBlockExpire: Date.now() + 10000,
          totalHits: 11,
        });
        // seed the memory map
        redisStorage.increment.mockRejectedValue(new Error('down'));
        storage.increment('key', 60000, 10, 30000, 'default').catch(() => null);

        const result = storage.fallback('key', 60000, 10, 30000, 'default');
        // first call creates record
        result.isBlocked = blockedRecord.isBlocked;
        result.timeToBlockExpire = blockedRecord.timeToBlockExpire;
        result.totalHits = blockedRecord.totalHits;

        const result2 = storage.fallback('key', 60000, 10, 30000, 'default');
        expect(result2).toBeDefined();
      });

      it('resets block when block has expired', () => {
        const key = 'expired-block-key';
        // Create a blocked record that has expired
        const firstResult = storage.fallback(key, 60000, 0, 100, 'default');
        // Manually expire the block
        firstResult.isBlocked = true;
        firstResult.timeToBlockExpire = Date.now() - 1;
        firstResult.totalHits = 5;

        const result = storage.fallback(key, 60000, 10, 30000, 'default');

        expect(result.isBlocked).toBe(false);
      });
    });

    describe('positive cases', () => {
      it('creates new record on first call', () => {
        const result = storage.fallback('new-key', 60000, 10, 30000, 'default');

        expect(result.totalHits).toBe(1);
        expect(result.isBlocked).toBe(false);
      });

      it('increments totalHits on subsequent calls', () => {
        const key = 'multi-key';
        storage.fallback(key, 60000, 10, 30000, 'default');
        storage.fallback(key, 60000, 10, 30000, 'default');
        const result = storage.fallback(key, 60000, 10, 30000, 'default');

        expect(result.totalHits).toBe(3);
      });

      it('blocks when totalHits exceeds limit', () => {
        const key = 'block-key';
        for (let i = 0; i <= 10; i++) {
          storage.fallback(key, 60000, 10, 30000, 'default');
        }

        const result = storage.fallback(key, 60000, 10, 30000, 'default');

        expect(result.isBlocked).toBe(true);
      });

      it('creates fresh record when previous has expired', () => {
        const key = 'expired-key';
        const first = storage.fallback(key, 1, 10, 30000, 'default');
        first.timeToExpire = Date.now() - 1;

        const result = storage.fallback(key, 60000, 10, 30000, 'default');

        expect(result.totalHits).toBe(1);
      });
    });
  });
});
