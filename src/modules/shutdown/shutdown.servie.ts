import { Injectable, OnApplicationShutdown } from '@nestjs/common';

import { LoggerService } from '../../logger/logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisManagerService } from '../redis-manager/redis-manager.service';

@Injectable()
export class ShutdownService implements OnApplicationShutdown {
  private shuttingDown = false;

  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly redisManager: RedisManagerService,
  ) {}

  isShuttingDown(): boolean {
    return this.shuttingDown;
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    this.shuttingDown = true;

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
