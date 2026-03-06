import { Injectable, OnApplicationShutdown } from '@nestjs/common';

import { LoggerService } from '../../logger/logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisManagerService } from '../redis-manager/redis-manager.service';

@Injectable()
export class ShutdownService implements OnApplicationShutdown {
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly redisManager: RedisManagerService,
  ) {}

  async onApplicationShutdown(signal?: string): Promise<void> {
    this.logger.log({
      ctx: ShutdownService.name,
      msg: `Shutdown started: ${signal ? signal : 'Without signal'}`,
    });

    const results = await Promise.allSettled([this.prisma.$disconnect(), this.redisManager.destroy()]);

    results.forEach((r) => {
      if (r.status === 'rejected') {
        this.logger.error({
          ctx: ShutdownService.name,
          details: r.reason,
          msg: 'Shutdown failed',
        });
      }
    });

    this.logger.log({
      ctx: ShutdownService.name,
      msg: 'Shutdown completed',
    });
  }
}
