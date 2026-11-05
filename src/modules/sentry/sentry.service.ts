import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';

import { sentryConfig } from '../../config/sentry.config';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class SentryService implements OnModuleInit {
  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  // Sentry itself is initialized in src/instrument.ts before the app modules are imported
  onModuleInit(): void {
    const configSentry = this.configService.getOrThrow<ConfigType<typeof sentryConfig>>('sentryConfig');

    if (configSentry.sentryEnabled) {
      this.logger.log({
        ctx: SentryService.name,
        msg: '✅ Sentry is enabled',
      });
    } else {
      this.logger.warn({
        ctx: SentryService.name,
        msg: '⚠️ Sentry is disabled: SENTRY_ENABLED is not true or SENTRY_DSN is empty',
      });
    }
  }
}
