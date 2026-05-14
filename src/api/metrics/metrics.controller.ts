import { Controller, Get, Header } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { METRICS_ENDPOINT } from '../../constants/url.contants';
import { MetricsService } from '../../modules/metrics/metrics.service';

@Controller(METRICS_ENDPOINT)
@Public()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('database')
  @Header('Content-Type', 'text/plain; version=0.0.4')
  metrics(): Promise<string> {
    return this.metricsService.getDatabaseMetrics();
  }
}
