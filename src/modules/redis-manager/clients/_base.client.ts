// eslint-disable-next-line check-file/filename-naming-convention
import type { ConfigType } from '@nestjs/config';

import { Inject } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';

import { redisConfig } from '../../../config/redis.config';
import { LoggerService } from '../../../logger/logger.service';
import { EnvironmentService } from '../../environment/environment.service';

export class BaseRedisService {
  protected client: Redis;
  private readonly MAX_RETRIES = 3;

  constructor(
    @Inject(redisConfig.KEY)
    protected config: ConfigType<typeof redisConfig>,
    protected readonly environment: EnvironmentService,
    protected readonly logger: LoggerService,
  ) {}

  getClient(): Redis {
    return this.client;
  }

  getDefaultProps(): RedisOptions {
    return {
      autoResendUnfulfilledCommands: false,
      autoResubscribe: false,
      connectTimeout: 1000,
      enableOfflineQueue: false,
      host: this.config.redisHost,
      maxRetriesPerRequest: 0,
      port: this.config.redisPort,
      retryStrategy: this.environment.isTest()
        ? (): null => null
        : (times): null | number => {
            if (times > this.MAX_RETRIES) return null;

            return Math.min(times * 200, 2000);
          },
    };
  }
}
