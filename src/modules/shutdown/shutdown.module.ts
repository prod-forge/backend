import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { LoggerModule } from '../../logger/logger.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisManagerModule } from '../redis-manager/redis-manager.module';
import { ShutdownHealthService } from './shutdown-health.service';
import { ShutdownService } from './shutdown.servie';

@Module({
  exports: [ShutdownHealthService],
  imports: [TerminusModule, PrismaModule, RedisManagerModule, LoggerModule],
  providers: [ShutdownService, ShutdownHealthService],
})
export class ShutdownModule {}
