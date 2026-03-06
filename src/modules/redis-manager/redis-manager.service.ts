import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { LoggerService } from '../../logger/logger.service';
import { BaseRedisService } from './clients/_base.client';
import { CacheRedis } from './clients/cache.client';
import { ThrottlerRedis } from './clients/throttler.client';

@Injectable()
export class RedisManagerService {
  private readonly redisClients: Record<string, BaseRedisService>;

  constructor(
    throttlerRedis: ThrottlerRedis,
    cacheRedis: CacheRedis,
    private readonly logger: LoggerService,
  ) {
    this.redisClients = {
      cacheRedis,
      throttlerRedis,
    };
  }

  async destroy(): Promise<void[]> {
    const clients = this.getClients();

    return Promise.all(
      clients.map(async (client) => {
        try {
          await client.quit();
          client.disconnect();
          client.removeAllListeners();
        } catch (error) {
          this.logger.error({
            ctx: RedisManagerService.name,
            details: error,
            msg: 'Redis has problem with destroy',
          });
        }
      }),
    );
  }

  getCacheRedis(): Redis {
    return this.redisClients.cacheRedis.getClient();
  }

  getClients(): Redis[] {
    return Object.keys(this.redisClients).map((key: string) => this.redisClients[key].getClient());
  }

  getThrottlerRedis(): Redis {
    return this.redisClients.throttlerRedis.getClient();
  }
}
