import { Module } from '@nestjs/common';

import { LoggerModule } from '../../logger/logger.module';
import { PrismaService } from './prisma.service';

@Module({
  exports: [PrismaService],
  imports: [LoggerModule],
  providers: [PrismaService],
})
export class PrismaModule {}
