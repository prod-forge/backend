import type { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { Injectable } from '@nestjs/common';

import { METRICS_ENDPOINT } from '../../../constants/url.contants';
import { HealthMetricsService } from '../health-metrics.service';

@Injectable()
export class HealthUpdateMiddleware implements NestMiddleware {
  constructor(private readonly healthMetricsService: HealthMetricsService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    if (req.path === `/${METRICS_ENDPOINT}`) {
      await this.healthMetricsService.updateMetrics();
    }
    next();
  }
}
