import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from '../../api/health/health.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisManagerModule } from '../redis-manager/redis-manager.module';
import { ShutdownModule } from '../shutdown/shutdown.module';
import { HealthMetricsService } from './health-metrics.service';
import { HealthChecks } from './health.checks';
import { ServiceHealthMetric } from './health.metrics';

@Module({
  controllers: [HealthController],
  exports: [],
  imports: [
    PrismaModule,
    TerminusModule.forRoot({
      logger: false,
    }),
    RedisManagerModule,
    ShutdownModule,
  ],
  providers: [HealthChecks, HealthMetricsService, ServiceHealthMetric],
})
export class HealthModule {}
