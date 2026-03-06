import { Module } from '@nestjs/common';

import { LoggerModule } from '../../logger/logger.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisManagerModule } from '../redis-manager/redis-manager.module';
import { ShutdownService } from './shutdown.servie';

@Module({
  exports: [],
  imports: [PrismaModule, RedisManagerModule, LoggerModule],
  providers: [ShutdownService],
})
export class ShutdownModule {}
