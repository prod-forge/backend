import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckResult } from '@nestjs/terminus';

import { HEALTH_ENDPOINT } from '../../constants/url.constants';
import { HealthChecks } from '../../modules/health/health.checks';

@Controller(HEALTH_ENDPOINT)
export class HealthController {
  constructor(private healthChecks: HealthChecks) {}

  @Get('deps')
  @HealthCheck()
  deps(): Promise<HealthCheckResult> {
    return this.healthChecks.runAll();
  }

  @Get()
  @HealthCheck()
  ready(): Promise<HealthCheckResult> {
    return this.healthChecks.runCritical();
  }
}
