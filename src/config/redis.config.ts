import { registerAs } from '@nestjs/config';
import { ConfigFactory } from '@nestjs/config/dist/interfaces';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

import { validateConfig } from '../common/utils/validate-config.util';
import { RedisConfigInterface } from './interfaces/redis-config.interface';

class RedisConfig {
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  REDIS_ENABLED = true;

  @IsString()
  REDIS_HOST = 'localhost';

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  REDIS_PORT = 6379;

  @IsBoolean()
  @Transform(({ obj }: { obj: Record<string, unknown> }) => {
    const raw = obj.REDIS_TLS;

    if (raw === 'true') return true;
    if (raw === 'false' || raw === undefined) return false;

    return raw;
  })
  REDIS_TLS = false;
}

export const redisConfig = registerAs<RedisConfig, ConfigFactory<RedisConfigInterface>>(
  'redisConfig',
  (): RedisConfigInterface => {
    const config = validateConfig(RedisConfig);

    return {
      redisEnabled: config.REDIS_ENABLED,
      redisHost: config.REDIS_HOST,
      redisPassword: config.REDIS_PASSWORD || undefined,
      redisPort: config.REDIS_PORT,
      redisTls: config.REDIS_TLS,
    };
  },
);
