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
      const state = (await Promise.all(clients.map(async (client) => client.ping()))).every(
        (res: string) => res === 'PONG',
      );
      if (state) {
        return {
          [serviceName]: { status: 'up' },
        };
      }

      return {
        [serviceName]: {
          message: 'Redis is unavailable (optional dependency)',
          status: 'down',
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return {
        [serviceName]: {
          message: 'Redis is unavailable (optional dependency)',
          status: 'down',
        },
      };
    }
  }
}
