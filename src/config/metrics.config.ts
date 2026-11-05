import type { ConfigFactory } from '@nestjs/config';

import { registerAs } from '@nestjs/config';
import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

import { validateConfig } from '../common/utils/validate-config.util';
import { MetricsConfigInterface } from './interfaces/metrics-config.interface';

class MetricsConfig {
  @IsNumber()
  @Transform(({ value }) => Number(value))
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
