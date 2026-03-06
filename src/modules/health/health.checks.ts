import { Injectable } from '@nestjs/common';
import { HealthCheckResult, HealthCheckService, HealthIndicatorResult, PrismaHealthIndicator } from '@nestjs/terminus';

import { PrismaService } from '../prisma/prisma.service';
import { RedisHealthService } from '../redis-manager/redis-health.service';

@Injectable()
export class HealthChecks {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private prismaService: PrismaService,
    private redisHealth: RedisHealthService,
  ) {}

  async run(): Promise<HealthCheckResult> {
    try {
      return await this.health.check([
        (): Promise<HealthIndicatorResult<'database'>> => this.db.pingCheck('database', this.prismaService),
        (): Promise<HealthIndicatorResult<'redis'>> => this.redisHealth.pingCheck('redis'),
      ]);
    } catch (_error) {
      const { response } = _error as { response: HealthCheckResult };
      const { details, error, info } = response;

      return {
        details,
        error,
        info,
        status: 'ok',
      };
    }
  }
}
