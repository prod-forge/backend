import type { ConfigFactory } from '@nestjs/config';

import { registerAs } from '@nestjs/config';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, Min } from 'class-validator';

import { toNumber, validateConfig } from '../common/utils/validate-config.util';
import { ThrottlerConfigInterface } from './interfaces/throttler-config.interface';

class ThrottlerConfig {
  @IsBoolean()
  @Transform(({ value }) => value !== 'false' && value !== false)
  THROTTLE_ENABLED = true;

  @IsInt()
  @Min(1)
  @Transform(toNumber)
  THROTTLE_LIMIT = 60;

  @IsInt()
  @Min(1)
  @Transform(toNumber)
  THROTTLE_TTL = 60000;
}

export const throttlerConfig = registerAs<ThrottlerConfig, ConfigFactory<ThrottlerConfigInterface>>(
  'throttlerConfig',
  (): ThrottlerConfigInterface => {
    const config = validateConfig(ThrottlerConfig);

    return {
      throttlerEnabled: config.THROTTLE_ENABLED,
      throttlerLimit: config.THROTTLE_LIMIT,
      throttlerTtl: config.THROTTLE_TTL,
    };
  },
);
