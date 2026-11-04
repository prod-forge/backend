import type { ConfigType } from '@nestjs/config';

import { BeforeApplicationShutdown, Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';

import { appConfig } from '../../config/app.config';
import { LoggerService } from '../../logger/logger.service';
import { shutdownTracing } from '../../tracing';
import { RequestTrackingService } from '../in-flight-requests/request-tracking.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisManagerService } from '../redis-manager/redis-manager.service';

@Injectable()
export class ShutdownService implements BeforeApplicationShutdown, OnApplicationShutdown {
  private shuttingDown = false;

  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
    private readonly redisManager: RedisManagerService,
    private readonly requestTrackingService: RequestTrackingService,
  ) {}

  async beforeApplicationShutdown(signal?: string): Promise<void> {
    this.shuttingDown = true;

    this.logger.log({
      ctx: ShutdownService.name,
      msg: `Shutdown started: ${signal ? signal : 'Without signal'}, draining for ${this.config.shutdownDrainMs}ms`,
    });

    await new Promise<void>((resolve) => setTimeout(resolve, this.config.shutdownDrainMs));

    const inFlightRequests = this.requestTrackingService.getActiveRequests();

    if (inFlightRequests > 0) {
      this.logger.log({
        ctx: ShutdownService.name,
        msg: `Waiting for ${inFlightRequests} in-flight requests to finish...`,
      });

      await this.requestTrackingService.waitForRequestsToFinish(this.config.shutdownInflightTimeoutMs);
    }
  }

  isShuttingDown(): boolean {
    return this.shuttingDown;
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    const results = await Promise.allSettled([
      this.prisma.$disconnect(),
      this.redisManager.destroy(),
      shutdownTracing(),
    ]);

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
      msg: `Shutdown completed: ${signal ? signal : 'Without signal'}`,
    });
  }
}
