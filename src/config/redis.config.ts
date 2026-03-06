import { registerAs } from '@nestjs/config';
import { ConfigFactory } from '@nestjs/config/dist/interfaces';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

import { validateConfig } from '../common/utils/validate-config.util';
import { RedisConfigInterface } from './interfaces/redis-config.interface';

class RedisConfig {
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  REDIS_ENABLED = true;

  @IsString()
  REDIS_HOST = 'localhost';

  @IsNumber()
  @Transform(({ value }) => Number(value))
  REDIS_PORT = 6379;
}

export const redisConfig = registerAs<RedisConfig, ConfigFactory<RedisConfigInterface>>(
  'redisConfig',
  (): RedisConfigInterface => {
    const config = validateConfig(RedisConfig);

    return {
      redisEnabled: config.REDIS_ENABLED,
      redisHost: config.REDIS_HOST,
      redisPort: config.REDIS_PORT,
    };
  },
);
