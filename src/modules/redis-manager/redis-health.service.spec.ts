import { Test } from '@nestjs/testing';

import { LoggerService } from '../../logger/logger.service';
import { RedisHealthService } from './redis-health.service';
import { RedisManagerService } from './redis-manager.service';

const makeRedisMock = (pingResult: Promise<string>): { ping: jest.Mock } => ({
  ping: jest.fn().mockReturnValue(pingResult),
});

describe('RedisHealthService', () => {
  let service: RedisHealthService;
  let redisManager: { getClients: jest.Mock };
  let logger: { error: jest.Mock; warn: jest.Mock };

  beforeEach(async () => {
    redisManager = { getClients: jest.fn() };
    logger = { error: jest.fn(), warn: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        RedisHealthService,
        { provide: RedisManagerService, useValue: redisManager },
        { provide: LoggerService, useValue: logger },
      ],
    }).compile();

    service = module.get(RedisHealthService);
  });

  describe('negative cases', () => {
    it('returns down when ping does not return PONG', async () => {
      redisManager.getClients.mockReturnValue([makeRedisMock(Promise.resolve('ERR')) as never]);

      const result = await service.pingCheck('redis');

      expect(result.redis.status).toBe('down');
    });

    it('returns down when ping rejects', async () => {
      redisManager.getClients.mockReturnValue([makeRedisMock(Promise.reject(new Error('conn refused'))) as never]);

      const result = await service.pingCheck('redis');

      expect(result.redis.status).toBe('down');
    });

    it('returns down when one of multiple clients fails', async () => {
      redisManager.getClients.mockReturnValue([
        makeRedisMock(Promise.resolve('PONG')) as never,
        makeRedisMock(Promise.resolve('ERR')) as never,
      ]);

      const result = await service.pingCheck('redis');

      expect(result.redis.status).toBe('down');
    });

    it('logs warning on degraded state', async () => {
      redisManager.getClients.mockReturnValue([makeRedisMock(Promise.resolve('ERR')) as never]);

      await service.pingCheck('redis');

      expect(logger.warn).toHaveBeenCalled();
    });

    it('returns down and logs error when clients list cannot be processed', async () => {
      redisManager.getClients.mockReturnValue(null);

      const result = await service.pingCheck('redis');

      expect(result.redis.status).toBe('down');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('positive cases', () => {
    it('returns up when all clients respond PONG', async () => {
      redisManager.getClients.mockReturnValue([
        makeRedisMock(Promise.resolve('PONG')) as never,
        makeRedisMock(Promise.resolve('PONG')) as never,
      ]);

      const result = await service.pingCheck('redis');

      expect(result.redis.status).toBe('up');
    });

    it('uses the provided service name as key', async () => {
      redisManager.getClients.mockReturnValue([makeRedisMock(Promise.resolve('PONG')) as never]);

      const result = await service.pingCheck('my-redis');

      expect(result['my-redis']).toBeDefined();
    });
  });
});
