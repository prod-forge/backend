import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckResult } from '@nestjs/terminus';

import { HEALTH_ENDPOINT } from '../../constants/url.contants';
import { HealthChecks } from '../../modules/health/health.checks';

@Controller(HEALTH_ENDPOINT)
export class HealthController {
  constructor(private healthChecks: HealthChecks) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.healthChecks.run();
  }
}
