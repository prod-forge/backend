import type { NestMiddleware } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';

import { Inject, Injectable } from '@nestjs/common';

import { metricsConfig } from '../../../config/metrics.config';
import { METRICS_ENDPOINT } from '../../../constants/url.constants';
import { HealthMetricsService } from '../health-metrics.service';

@Injectable()
export class HealthUpdateMiddleware implements NestMiddleware {
  private lastRunAt = 0;

  constructor(
    private readonly healthMetricsService: HealthMetricsService,
    @Inject(metricsConfig.KEY)
    private readonly config: ConfigType<typeof metricsConfig>,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    if (req.path === `/${METRICS_ENDPOINT}` && this.isDue()) {
      await this.healthMetricsService.updateMetrics();
    }
    next();
  }

  private isDue(): boolean {
    const now = Date.now();
    if (now - this.lastRunAt < this.config.healthCheckTriggerMs) {
      return false;
    }
    this.lastRunAt = now;

    return true;
  }
}
