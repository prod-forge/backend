import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import { appConfig } from '../../config/app.config';
import { sentryConfig } from '../../config/sentry.config';
import { LoggerService } from '../../logger/logger.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable()
export class SentryService implements OnModuleInit {
  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly environmentService: EnvironmentService,
  ) {}

  onModuleInit(): void {
    const configSentry = this.configService.getOrThrow<ConfigType<typeof sentryConfig>>('sentryConfig');
    const configApp = this.configService.getOrThrow<ConfigType<typeof appConfig>>('appConfig');
    // Check if Sentry is configured and not in development
    if (configSentry.sentryEnabled) {
      Sentry.init({
        beforeSend(event, hint) {
          const error = hint.originalException as Error;

          if (configSentry.sentryIgnoredErrors.some((e) => error?.name?.includes(e))) {
            return null;
          }

          // ValidationError must be skipped from Sentry
          if (error?.name === 'ValidationError') return null;

          return event;
        },
        dsn: configSentry.sentryDsn,
        environment: this.environmentService.getEnv(),
        integrations: [nodeProfilingIntegration()],

        release: configApp.appVersion,

        sendDefaultPii: true,

        tracesSampleRate: 0.2,
      });
      this.logger.log({
        ctx: SentryService.name,
        msg: '✅ Sentry initialized for production',
      });
    } else {
      this.logger.warn({
        ctx: SentryService.name,
        msg: '⚠️ Sentry is disabled in development mode',
      });
    }
  }
}
