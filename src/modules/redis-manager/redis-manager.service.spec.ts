import { Test } from '@nestjs/testing';

import { RedisErrors } from '../../error-handler/errors/redis.errors';
import { LoggerService } from '../../logger/logger.service';
import { CacheRedis } from './clients/cache.client';
import { ThrottlerRedis } from './clients/throttler.client';
import { RedisManagerService } from './redis-manager.service';

const makeRedisMock = (): Record<string, jest.Mock> => ({
  disconnect: jest.fn(),
  quit: jest.fn().mockResolvedValue('OK'),
  removeAllListeners: jest.fn(),
});

describe('RedisManagerService', () => {
  let service: RedisManagerService;
  let cacheMock: ReturnType<typeof makeRedisMock>;
  let throttlerMock: ReturnType<typeof makeRedisMock>;
  let logger: { error: jest.Mock };

  beforeEach(async () => {
    cacheMock = makeRedisMock();
    throttlerMock = makeRedisMock();
    logger = { error: jest.fn() };

    const cacheRedis = { getClient: jest.fn().mockReturnValue(cacheMock) };
    const throttlerRedis = { getClient: jest.fn().mockReturnValue(throttlerMock) };

    const module = await Test.createTestingModule({
      providers: [
        RedisManagerService,
        { provide: CacheRedis, useValue: cacheRedis },
        { provide: ThrottlerRedis, useValue: throttlerRedis },
        { provide: LoggerService, useValue: logger },
      ],
    }).compile();

    service = module.get(RedisManagerService);
  });

  describe('negative cases', () => {
    it('destroy logs error when quit fails with an Error instance', async () => {
      cacheMock.quit.mockRejectedValue(new Error('quit failed'));

      await service.destroy();

      expect(logger.error).toHaveBeenCalled();
    });

    it('destroy does not log error when quit fails with a non-Error value', async () => {
      cacheMock.quit.mockRejectedValue('non-error string');

      await service.destroy();

      expect(logger.error).not.toHaveBeenCalled();
    });

    it('destroy still disconnects a client whose quit fails, so reconnecting stops', async () => {
      cacheMock.quit.mockRejectedValue(new Error('Stream is not writeable'));

      await service.destroy();

      expect(cacheMock.disconnect).toHaveBeenCalled();
    });
  });

  describe('positive cases', () => {
    it('getCacheRedis returns cache redis client', () => {
      expect(service.getCacheRedis()).toBe(cacheMock);
    });

    it('getThrottlerRedis returns throttler redis client', () => {
      expect(service.getThrottlerRedis()).toBe(throttlerMock);
    });

    it('getClients returns both clients', () => {
      const clients = service.getClients();

      expect(clients).toHaveLength(2);
      expect(clients).toContain(cacheMock);
      expect(clients).toContain(throttlerMock);
    });

    it('destroy quits and disconnects all clients', async () => {
      await service.destroy();

      expect(cacheMock.quit).toHaveBeenCalled();
      expect(cacheMock.disconnect).toHaveBeenCalled();
      expect(throttlerMock.quit).toHaveBeenCalled();
      expect(throttlerMock.disconnect).toHaveBeenCalled();
    });
  });
});

describe('RedisErrors', () => {
  describe('negative cases', () => {
    it('falls back to static message when empty string is provided', () => {
      const err = new RedisErrors('');

      expect(err.message).toBe(RedisErrors.message);
    });
  });

  describe('positive cases', () => {
    it('uses provided message when non-empty', () => {
      const err = new RedisErrors('custom redis error');

      expect(err.message).toBe('custom redis error');
    });
  });
});
