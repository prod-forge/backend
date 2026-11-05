import type { ThrottlerRedis } from '../clients/throttler.client';

import { ThrottlerRedisStorage } from './throttler-redis.storage';

const makeStorage = (): { evalMock: jest.Mock; storage: ThrottlerRedisStorage } => {
  const evalMock = jest.fn();
  const throttlerRedis = { getClient: () => ({ eval: evalMock }) } as unknown as ThrottlerRedis;

  return { evalMock, storage: new ThrottlerRedisStorage(throttlerRedis) };
};

describe('ThrottlerRedisStorage', () => {
  describe('negative cases', () => {
    it('throws when the script returns something other than four numbers', async () => {
      const { evalMock, storage } = makeStorage();
      evalMock.mockResolvedValue(['1', 60000, 0, 0]);

      await expect(storage.increment('ip', 60000, 10, 30000, 'default')).rejects.toThrow(TypeError);
    });

    it('propagates a Redis error so the caller can fall back', async () => {
      const { evalMock, storage } = makeStorage();
      evalMock.mockRejectedValue(new Error('connection lost'));

      await expect(storage.increment('ip', 60000, 10, 30000, 'default')).rejects.toThrow('connection lost');
    });
  });

  describe('positive cases', () => {
    it('passes both keys in one hash slot and the limits in milliseconds', async () => {
      const { evalMock, storage } = makeStorage();
      evalMock.mockResolvedValue([1, 60000, 0, 0]);

      await storage.increment('ip', 60000, 10, 30000, 'default');

      expect(evalMock).toHaveBeenCalledWith(
        expect.any(String),
        2,
        '{ip:default}:hits',
        '{ip:default}:blocked',
        60000,
        10,
        30000,
      );
    });

    it('returns the hit count with times rounded up to seconds', async () => {
      const { evalMock, storage } = makeStorage();
      evalMock.mockResolvedValue([3, 59001, 0, 0]);

      const record = await storage.increment('ip', 60000, 10, 30000, 'default');

      expect(record).toEqual({ isBlocked: false, timeToBlockExpire: 0, timeToExpire: 60, totalHits: 3 });
    });

    it('reports a block with its remaining time', async () => {
      const { evalMock, storage } = makeStorage();
      evalMock.mockResolvedValue([11, 42000, 1, 29500]);

      const record = await storage.increment('ip', 60000, 10, 30000, 'default');

      expect(record).toEqual({ isBlocked: true, timeToBlockExpire: 30, timeToExpire: 42, totalHits: 11 });
    });
  });
});
