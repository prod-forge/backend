import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from '../../common/decorators/public.decorator';
import { HEALTH_ENDPOINT } from '../../constants/url.contants';
import { HealthChecks } from '../../modules/health/health.checks';

@Controller(HEALTH_ENDPOINT)
@Public()
@SkipThrottle()
export class HealthController {
  constructor(private readonly healthChecks: HealthChecks) {}

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
