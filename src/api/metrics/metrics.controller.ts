import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from '../../common/decorators/public.decorator';
import { METRICS_ENDPOINT } from '../../constants/url.constants';
import { DatabaseMetricInterface } from '../../modules/metrics/interfaces/database-metric.interface';
import { MetricsService } from '../../modules/metrics/metrics.service';

@Controller(METRICS_ENDPOINT)
@Public()
@SkipThrottle()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('database')
  metrics(): Promise<DatabaseMetricInterface[]> {
    return this.metricsService.getDatabaseMetrics();
  }
}
