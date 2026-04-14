import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';

import { LoggerService } from '../../logger/logger.service';
import { RedisManagerService } from './redis-manager.service';

@Injectable()
export class RedisHealthService {
  constructor(
    protected redisManager: RedisManagerService,
    private readonly logger: LoggerService,
  ) {}

  async pingCheck(serviceName: string): Promise<HealthIndicatorResult<string, 'down' | 'up'>> {
    const clients = this.redisManager.getClients();

    try {
      const results = await Promise.allSettled(clients.map((client) => client.ping()));

      const isUp = results.every((r) => r.status === 'fulfilled' && r.value === 'PONG');

      if (isUp) {
        return {
          [serviceName]: { status: 'up' },
        };
      }
      this.logger.warn({
        ctx: 'RedisHealthService',
        msg: 'Redis degraded',
      });

      return {
        [serviceName]: {
          message: 'Redis unavailable (optional)',
          status: 'down',
        },
      };
    } catch (e) {
      this.logger.error({
        ctx: 'RedisHealthService',
        details: e,
        msg: 'Redis health check failed',
      });

      return {
        [serviceName]: {
          message: 'Redis unavailable (optional)',
          status: 'down',
        },
      };
    }
  }
}
