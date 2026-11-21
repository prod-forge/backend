import type { ConfigFactory } from '@nestjs/config';

import { registerAs } from '@nestjs/config';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

import { parseStrictBoolean } from '../common/utils/booleans';
import { validateConfig } from '../common/utils/validate-config.util';
import { RedisConfigInterface } from './interfaces/redis-config.interface';

class RedisConfig {
  @IsString()
  REDIS_HOST = 'localhost';

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  REDIS_PORT = 6379;

  @IsBoolean()
  @Transform(({ value }) => parseStrictBoolean(value))
  REDIS_TLS = false;
}

export const redisConfig = registerAs<RedisConfig, ConfigFactory<RedisConfigInterface>>(
  'redisConfig',
  (): RedisConfigInterface => {
    const config = validateConfig(RedisConfig);

    return {
      redisHost: config.REDIS_HOST,
      redisPassword: config.REDIS_PASSWORD || undefined,
      redisPort: config.REDIS_PORT,
      redisTls: config.REDIS_TLS,
    };
  },
);
