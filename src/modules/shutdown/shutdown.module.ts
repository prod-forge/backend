import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { RequestTrackingModule } from '../in-flight-requests/request-tracking.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisManagerModule } from '../redis-manager/redis-manager.module';
import { ShutdownHealthService } from './shutdown-health.service';
import { ShutdownService } from './shutdown.service';

@Module({
  exports: [ShutdownHealthService],
  imports: [TerminusModule, PrismaModule, RedisManagerModule, RequestTrackingModule],
  providers: [ShutdownService, ShutdownHealthService],
})
export class ShutdownModule {}
