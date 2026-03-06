import { NextFunction, Request, Response } from 'express';

import { HealthMetricsService } from '../health-metrics.service';

export const healthUpdateMiddleware =
  (healthMetricsService: HealthMetricsService, prometheusEndpoint: string) =>
  async (req: Request & { userId?: string }, res: Response, next: NextFunction): Promise<void> => {
    if (req.path === prometheusEndpoint) {
      await healthMetricsService.updateMetrics();
    }
    next();
  };
