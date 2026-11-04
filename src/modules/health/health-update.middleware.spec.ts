import type { NextFunction, Request, Response } from 'express';

import { Test } from '@nestjs/testing';

import { metricsConfig } from '../../config/metrics.config';
import { HealthMetricsService } from '../health/health-metrics.service';
import { HealthUpdateMiddleware } from './middlewares/health-update.middleware';

describe('HealthUpdateMiddleware', () => {
  let middleware: HealthUpdateMiddleware;
  let healthMetricsService: { updateMetrics: jest.Mock };

  beforeEach(async () => {
    jest.useFakeTimers();
    healthMetricsService = {
      updateMetrics: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        HealthUpdateMiddleware,
        { provide: HealthMetricsService, useValue: healthMetricsService },
        { provide: metricsConfig.KEY, useValue: { healthCheckTriggerMs: 15000 } },
      ],
    }).compile();

    middleware = module.get(HealthUpdateMiddleware);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('negative cases', () => {
    it('pings once for two scrapes within the trigger window', async () => {
      const req = { path: '/metrics' } as Request;
      const next = jest.fn() as NextFunction;

      await middleware.use(req, {} as Response, next);
      jest.advanceTimersByTime(14999);
      await middleware.use(req, {} as Response, next);

      expect(healthMetricsService.updateMetrics).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(2);
    });

    it('does not call updateMetrics for non-metrics paths', async () => {
      const req = { path: '/health' } as Request;
      const next = jest.fn() as NextFunction;

      await middleware.use(req, {} as Response, next);

      expect(healthMetricsService.updateMetrics).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('does not call updateMetrics for arbitrary paths', async () => {
      const req = { path: '/api/todos' } as Request;
      const next = jest.fn() as NextFunction;

      await middleware.use(req, {} as Response, next);

      expect(healthMetricsService.updateMetrics).not.toHaveBeenCalled();
    });
  });

  describe('positive cases', () => {
    it('calls updateMetrics when path is /metrics', async () => {
      const req = { path: '/metrics' } as Request;
      const next = jest.fn() as NextFunction;

      await middleware.use(req, {} as Response, next);

      expect(healthMetricsService.updateMetrics).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('pings again once the trigger window has passed', async () => {
      const req = { path: '/metrics' } as Request;
      const next = jest.fn() as NextFunction;

      await middleware.use(req, {} as Response, next);
      jest.advanceTimersByTime(15000);
      await middleware.use(req, {} as Response, next);

      expect(healthMetricsService.updateMetrics).toHaveBeenCalledTimes(2);
    });
  });
});
