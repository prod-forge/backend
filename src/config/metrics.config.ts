import type { ConfigFactory } from '@nestjs/config';

import { registerAs } from '@nestjs/config';
import { Transform } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

import { toNumber, validateConfig } from '../common/utils/validate-config.util';
import { MetricsConfigInterface } from './interfaces/metrics-config.interface';

class MetricsConfig {
  @IsInt()
  @Min(1)
  @Transform(toNumber)
  HEALTH_CHECK_TRIGGER_MS = 15000;
}

export const metricsConfig = registerAs<MetricsConfig, ConfigFactory<MetricsConfigInterface>>(
  'metricsConfig',
  (): MetricsConfigInterface => {
    const config = validateConfig(MetricsConfig);

    return {
      healthCheckTriggerMs: config.HEALTH_CHECK_TRIGGER_MS,
    };
  },
);
