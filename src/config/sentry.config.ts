import { registerAs } from '@nestjs/config';
import { ConfigFactory } from '@nestjs/config/dist/interfaces';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsString } from 'class-validator';

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
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value as string[];

    if (typeof value === 'string') {
      return JSON.parse(value) as string[];
    }

    return [];
  })
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
