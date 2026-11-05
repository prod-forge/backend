import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { HealthChecks } from '../../modules/health/health.checks';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let healthChecks: { runAll: jest.Mock; runCritical: jest.Mock };

  beforeEach(async () => {
    healthChecks = {
      runAll: jest.fn().mockResolvedValue({ details: {}, status: 'ok' }),
      runCritical: jest.fn().mockResolvedValue({ details: {}, status: 'ok' }),
    };

    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthChecks, useValue: healthChecks }],
    }).compile();

    controller = module.get(HealthController);
  });

  describe('negative cases', () => {
    it('live returns ok without running any dependency check, even when they would throw', () => {
      healthChecks.runAll.mockRejectedValue(new Error('prisma down'));
      healthChecks.runCritical.mockRejectedValue(new Error('prisma down'));

      expect(controller.live()).toEqual({ status: 'ok' });
      expect(healthChecks.runAll).not.toHaveBeenCalled();
      expect(healthChecks.runCritical).not.toHaveBeenCalled();
    });

    it('deps passes the 503 of a failed check through', async () => {
      const unavailable = new ServiceUnavailableException({ status: 'error' });
      healthChecks.runAll.mockRejectedValue(unavailable);

      await expect(controller.deps()).rejects.toBe(unavailable);
    });

    it('ready passes the 503 of a failed check through', async () => {
      const unavailable = new ServiceUnavailableException({ status: 'error' });
      healthChecks.runCritical.mockRejectedValue(unavailable);

      await expect(controller.ready()).rejects.toBe(unavailable);
    });
  });

  describe('positive cases', () => {
    it('deps calls healthChecks.runAll', async () => {
      const result = await controller.deps();

      expect(healthChecks.runAll).toHaveBeenCalled();
      expect(result).toEqual({ details: {}, status: 'ok' });
    });

    it('ready calls healthChecks.runCritical', async () => {
      const result = await controller.ready();

      expect(healthChecks.runCritical).toHaveBeenCalled();
      expect(result).toEqual({ details: {}, status: 'ok' });
    });
  });
});
