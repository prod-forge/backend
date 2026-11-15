import type { ConfigFactory } from '@nestjs/config';

import { registerAs } from '@nestjs/config';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsString } from 'class-validator';

import { parseJsonArray } from '../common/utils/json';
import { validateConfig } from '../common/utils/validate-config.util';
import { isSentryEnabled } from '../modules/sentry/sentry-enabled';
import { SentryConfigInterface } from './interfaces/sentry-config.interface';

class SentryConfig {
  @IsString()
  SENTRY_DSN = '';

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  SENTRY_ENABLED = false;

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => parseJsonArray(value))
  SENTRY_IGNORED_ERRORS: string[] = [];
}

export const sentryConfig = registerAs<SentryConfig, ConfigFactory<SentryConfigInterface>>(
  'sentryConfig',
  (): SentryConfigInterface => {
    const config = validateConfig(SentryConfig);

    return {
      sentryDsn: config.SENTRY_DSN,
      sentryEnabled: isSentryEnabled(process.env),
      sentryIgnoredErrors: config.SENTRY_IGNORED_ERRORS,
    };
  },
);
