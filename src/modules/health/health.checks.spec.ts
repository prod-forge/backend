import type { HealthCheckService } from '@nestjs/terminus';

import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaHealthIndicator, TerminusModule } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { RedisHealthService } from '../redis-manager/redis-health.service';
import { ShutdownHealthService } from '../shutdown/shutdown-health.service';
import { HealthChecks } from './health.checks';

describe('HealthChecks', () => {
  let service: HealthChecks;
  let healthCheckService: { check: jest.Mock<Promise<unknown>, [unknown[]]> };
  let dbIndicator: { pingCheck: jest.Mock };
  let redisHealth: { pingCheck: jest.Mock };
  let shutdownHealth: { check: jest.Mock };

  beforeEach(() => {
    healthCheckService = {
      check: jest.fn<Promise<unknown>, [unknown[]]>().mockResolvedValue({ details: {}, status: 'ok' }),
    };

    dbIndicator = {
      pingCheck: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
    };

    redisHealth = {
      pingCheck: jest.fn().mockResolvedValue({ redis: { status: 'up' } }),
    };

    shutdownHealth = {
      check: jest.fn().mockReturnValue({ shutdown: { status: 'up' } }),
    };

    service = new HealthChecks(
      healthCheckService as unknown as HealthCheckService,
      dbIndicator as unknown as PrismaHealthIndicator,
      {} as PrismaService,
      redisHealth as unknown as RedisHealthService,
      shutdownHealth as unknown as ShutdownHealthService,
    );
  });

  describe('negative cases', () => {
    // The real Terminus HealthCheckService turns a "down" indicator into a 503 with the failing check in the body
    const withTerminus = async (): Promise<HealthChecks> => {
      const module = await Test.createTestingModule({
        imports: [TerminusModule.forRoot({ logger: false })],
        providers: [
          HealthChecks,
          { provide: PrismaHealthIndicator, useValue: dbIndicator },
          { provide: PrismaService, useValue: {} },
          { provide: RedisHealthService, useValue: redisHealth },
          { provide: ShutdownHealthService, useValue: shutdownHealth },
        ],
      }).compile();

      return module.get(HealthChecks);
    };

    const responseOf = async (promise: Promise<unknown>): Promise<unknown> => {
      const error = await promise.catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ServiceUnavailableException);

      return (error as ServiceUnavailableException).getResponse();
    };

    it('runAll fails with 503 when the database ping is down', async () => {
      dbIndicator.pingCheck.mockResolvedValue({ database: { message: 'timeout', status: 'down' } });
      const checks = await withTerminus();

      await expect(responseOf(checks.runAll())).resolves.toMatchObject({
        error: { database: { status: 'down' } },
        info: { redis: { status: 'up' } },
        status: 'error',
      });
    });

    it('runAll fails with 503 when the redis ping is down', async () => {
      redisHealth.pingCheck.mockResolvedValue({ redis: { status: 'down' } });
      const checks = await withTerminus();

      await expect(responseOf(checks.runAll())).resolves.toMatchObject({
        error: { redis: { status: 'down' } },
        info: { database: { status: 'up' } },
        status: 'error',
      });
    });

    it('runCritical fails with 503 when the database ping is down', async () => {
      dbIndicator.pingCheck.mockResolvedValue({ database: { status: 'down' } });
      const checks = await withTerminus();

      await expect(responseOf(checks.runCritical())).resolves.toMatchObject({
        error: { database: { status: 'down' } },
        status: 'error',
      });
    });

    it('runCritical fails with 503 while the app is shutting down', async () => {
      shutdownHealth.check.mockReturnValue({ shutdown: { status: 'down' } });
      const checks = await withTerminus();

      await expect(responseOf(checks.runCritical())).resolves.toMatchObject({
        error: { shutdown: { status: 'down' } },
        status: 'error',
      });
    });
  });

  describe('positive cases', () => {
    it('runAll calls health.check', async () => {
      await service.runAll();

      expect(healthCheckService.check).toHaveBeenCalledWith(expect.any(Array));
    });

    it('runCritical calls health.check', async () => {
      await service.runCritical();

      expect(healthCheckService.check).toHaveBeenCalledWith(expect.any(Array));
    });

    it('runAll returns health check result', async () => {
      const result = await service.runAll();

      expect(result).toEqual({ details: {}, status: 'ok' });
    });

    it('runAll passes two check functions', async () => {
      await service.runAll();

      expect(healthCheckService.check.mock.calls[0][0]).toHaveLength(2);
    });

    it('runCritical passes two check functions', async () => {
      await service.runCritical();

      expect(healthCheckService.check.mock.calls[0][0]).toHaveLength(2);
    });

    it('runAll executes the db ping check function', async () => {
      healthCheckService.check.mockImplementation(async (checks) => {
        for (const fn of checks as (() => Promise<unknown>)[]) await fn();

        return { details: {}, status: 'ok' };
      });

      await service.runAll();

      expect(dbIndicator.pingCheck).toHaveBeenCalled();
    });

    it('runAll executes the redis ping check function', async () => {
      healthCheckService.check.mockImplementation(async (checks) => {
        for (const fn of checks as (() => Promise<unknown>)[]) await fn();

        return { details: {}, status: 'ok' };
      });

      await service.runAll();

      expect(redisHealth.pingCheck).toHaveBeenCalled();
    });

    it('runCritical executes the shutdown check function', async () => {
      healthCheckService.check.mockImplementation((checks: unknown[]) => {
        for (const fn of checks as (() => unknown)[]) fn();

        return { details: {}, status: 'ok' } as never;
      });

      await service.runCritical();

      expect(shutdownHealth.check).toHaveBeenCalled();
    });
  });
});
