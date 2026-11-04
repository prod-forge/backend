// eslint-disable-next-line @check-file/filename-naming-convention
import type { ConfigType } from '@nestjs/config';

import { Inject } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';

import { redisConfig } from '../../../config/redis.config';
import { LoggerService } from '../../../logger/logger.service';
import { EnvironmentService } from '../../environment/environment.service';

const RETRY_STEP_MS = 200;
const RETRY_MAX_DELAY_MS = 5000;
const RETRY_LOG_EVERY = 10;

export class BaseRedisService {
  protected client: Redis;

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
    if (this.config.redisTls && !this.config.redisPassword && this.environment.isProduction()) {
      this.logger.warn({
        ctx: BaseRedisService.name,
        msg: 'REDIS_TLS is enabled in production without REDIS_PASSWORD',
      });
    }

    return {
      autoResendUnfulfilledCommands: false,
      autoResubscribe: false,
      connectTimeout: 1000,
      enableOfflineQueue: false,
      host: this.config.redisHost,
      maxRetriesPerRequest: 0,
      ...(this.config.redisPassword ? { password: this.config.redisPassword } : {}),
      port: this.config.redisPort,
      retryStrategy: this.environment.isTest() ? (): null => null : this.createRetryStrategy(),
      // Empty options use Node's default CA store; ElastiCache certificates chain to a public Amazon root.
      // The servername is derived from `host` by Node, so certificate verification stays on.
      ...(this.config.redisTls ? { tls: {} } : {}),
    };
  }

  private createRetryStrategy(): (times: number) => number {
    return (times: number): number => {
      if (times === 1 || times % RETRY_LOG_EVERY === 0) {
        this.logger.warn({
          ctx: BaseRedisService.name,
          msg: `Redis reconnect attempt ${times}`,
        });
      }

      return Math.min(times * RETRY_STEP_MS, RETRY_MAX_DELAY_MS);
    };
  }
}
