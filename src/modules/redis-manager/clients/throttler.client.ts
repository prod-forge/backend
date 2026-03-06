import type { ConfigType } from '@nestjs/config';

import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import type { RedisOptionsInterface } from '../interfaces/redis-options.interface';

import { redisConfig } from '../../../config/redis.config';
import { LoggerService } from '../../../logger/logger.service';
import { EnvironmentService } from '../../environment/environment.service';
import { REDIS_THROTTLER } from '../di/di.types';
import { BaseRedisService } from './_base.client';

@Injectable()
export class ThrottlerRedis extends BaseRedisService {
  constructor(
    @Inject(redisConfig.KEY)
    config: ConfigType<typeof redisConfig>,
    environment: EnvironmentService,
    @Inject(REDIS_THROTTLER) redisOptions: RedisOptionsInterface,
    logger: LoggerService,
  ) {
    super(config, environment, logger);
    this.client = new Redis({ ...this.getDefaultProps(), ...redisOptions });
    this.config = config;
    this.listen();
  }

  listen(): void {
    this.client.on('connect', () => {
      this.logger.log({
        ctx: 'ThrottlerRedis',
        msg: 'ThrottlerRedis connected',
      });
    });

    this.client.on('close', () => {
      this.logger.warn({
        ctx: 'ThrottlerRedis',
        msg: 'ThrottlerRedis disconnected',
      });
    });

    this.client.on('error', (err) => {
      this.logger.error({
        ctx: 'ThrottlerRedis',
        details: err,
        msg: 'ThrottlerRedis error',
      });
    });
  }
}
