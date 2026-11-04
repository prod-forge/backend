import { Test } from '@nestjs/testing';

import { appConfig } from '../../config/app.config';
import { LoggerService } from '../../logger/logger.service';
import { RequestTrackingService } from '../in-flight-requests/request-tracking.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisManagerService } from '../redis-manager/redis-manager.service';
import { ShutdownService } from './shutdown.service';

const DRAIN_MS = 10000;
const INFLIGHT_TIMEOUT_MS = 20000;

describe('ShutdownService', () => {
  let service: ShutdownService;
  let logger: { error: jest.Mock; log: jest.Mock };
  let prisma: { $disconnect: jest.Mock };
  let redisManager: { destroy: jest.Mock };
  let requestTracking: { getActiveRequests: jest.Mock; waitForRequestsToFinish: jest.Mock };

  beforeEach(async () => {
    jest.useFakeTimers();

    logger = { error: jest.fn(), log: jest.fn() };
    prisma = { $disconnect: jest.fn().mockResolvedValue(undefined) };
    redisManager = { destroy: jest.fn().mockResolvedValue([]) };
    requestTracking = {
      getActiveRequests: jest.fn().mockReturnValue(0),
      waitForRequestsToFinish: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        ShutdownService,
        { provide: LoggerService, useValue: logger },
        { provide: PrismaService, useValue: prisma },
        { provide: RedisManagerService, useValue: redisManager },
        { provide: RequestTrackingService, useValue: requestTracking },
        {
          provide: appConfig.KEY,
          useValue: { shutdownDrainMs: DRAIN_MS, shutdownInflightTimeoutMs: INFLIGHT_TIMEOUT_MS },
        },
      ],
    }).compile();

    service = module.get(ShutdownService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('negative cases', () => {
    it('logs an error when prisma disconnect fails and still resolves', async () => {
      prisma.$disconnect.mockRejectedValue(new Error('disconnect failed'));

      await expect(service.onApplicationShutdown('SIGTERM')).resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ msg: 'Shutdown failed' }));
      expect(redisManager.destroy).toHaveBeenCalled();
    });

    it('does not resolve beforeApplicationShutdown before the drain period elapses', async () => {
      let resolved = false;
      void service.beforeApplicationShutdown('SIGTERM').then(() => {
        resolved = true;
      });

      await jest.advanceTimersByTimeAsync(DRAIN_MS - 1);

      expect(resolved).toBe(false);
    });

    it('does not disconnect dependencies in beforeApplicationShutdown', async () => {
      const pending = service.beforeApplicationShutdown('SIGTERM');
      await jest.advanceTimersByTimeAsync(DRAIN_MS);
      await pending;

      expect(prisma.$disconnect).not.toHaveBeenCalled();
      expect(redisManager.destroy).not.toHaveBeenCalled();
    });
  });

  describe('positive cases', () => {
    it('isShuttingDown returns false initially', () => {
      expect(service.isShuttingDown()).toBe(false);
    });

    it('flips isShuttingDown to true before the drain timer elapses', async () => {
      const pending = service.beforeApplicationShutdown('SIGTERM');

      expect(service.isShuttingDown()).toBe(true);

      await jest.advanceTimersByTimeAsync(DRAIN_MS);
      await pending;
    });

    it('resolves beforeApplicationShutdown after drainMs', async () => {
      let resolved = false;
      void service.beforeApplicationShutdown('SIGTERM').then(() => {
        resolved = true;
      });

      await jest.advanceTimersByTimeAsync(DRAIN_MS);

      expect(resolved).toBe(true);
    });

    it('logs shutdown started and completed', async () => {
      const pending = service.beforeApplicationShutdown('SIGTERM');
      await jest.advanceTimersByTimeAsync(DRAIN_MS);
      await pending;
      await service.onApplicationShutdown('SIGTERM');

      expect(logger.log).toHaveBeenCalledWith(
        expect.objectContaining({ msg: expect.stringContaining('Shutdown started') as string }),
      );
      expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({ msg: 'Shutdown completed: SIGTERM' }));
    });

    it('waits for in-flight requests with the configured timeout when active', async () => {
      requestTracking.getActiveRequests.mockReturnValue(2);

      await service.onApplicationShutdown('SIGTERM');

      expect(requestTracking.waitForRequestsToFinish).toHaveBeenCalledWith(INFLIGHT_TIMEOUT_MS);
    });

    it('does not wait when no active requests', async () => {
      await service.onApplicationShutdown('SIGTERM');

      expect(requestTracking.waitForRequestsToFinish).not.toHaveBeenCalled();
    });

    it('disconnects prisma and redis on shutdown', async () => {
      await service.onApplicationShutdown('SIGTERM');

      expect(prisma.$disconnect).toHaveBeenCalled();
      expect(redisManager.destroy).toHaveBeenCalled();
    });

    it('works without signal parameter', async () => {
      await expect(service.onApplicationShutdown()).resolves.toBeUndefined();
    });
  });
});
