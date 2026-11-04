import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from '../../common/decorators/public.decorator';
import { HEALTH_ENDPOINT } from '../../constants/url.constants';
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

  // Liveness: the process is up. No dependency checks, so a DB outage never restarts healthy tasks
  @Get('live')
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get()
  @HealthCheck()
  ready(): Promise<HealthCheckResult> {
    return this.healthChecks.runCritical();
  }
}
