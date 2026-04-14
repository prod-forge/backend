import { Injectable } from '@nestjs/common';
import { HealthCheckResult, HealthCheckService, HealthIndicatorResult, PrismaHealthIndicator } from '@nestjs/terminus';

import { PrismaService } from '../prisma/prisma.service';
import { RedisHealthService } from '../redis-manager/redis-health.service';
import { ShutdownHealthService } from '../shutdown/shutdown-health.service';

@Injectable()
export class HealthChecks {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private prismaService: PrismaService,
    private redisHealth: RedisHealthService,
    private shutdownHealthService: ShutdownHealthService,
  ) {}

  async runAll(): Promise<HealthCheckResult> {
    return this.health.check([
      (): Promise<HealthIndicatorResult<'database'>> => this.db.pingCheck('database', this.prismaService),
      (): Promise<HealthIndicatorResult<'redis'>> => this.redisHealth.pingCheck('redis'),
    ]);
  }

  async runCritical(): Promise<HealthCheckResult> {
    return this.health.check([
      (): Promise<HealthIndicatorResult<'database'>> => this.db.pingCheck('database', this.prismaService),
      (): HealthIndicatorResult<'shutdown'> => this.shutdownHealthService.check('shutdown'),
    ]);
  }
}
