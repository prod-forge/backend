import type { INestApplication } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { ValidationError } from 'class-validator';

import { ClassSerializerInterceptor, RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { useContainer } from 'class-validator';
import compression from 'compression';
import httpContext from 'express-http-context';
import helmet from 'helmet';

import type { apiConfig } from './config/api.config';
import type { appConfig } from './config/app.config';
import type { logConfig } from './config/log.config';
import type { sentryConfig } from './config/sentry.config';

import { AppModule } from './app.module';
import { UnifiedResponseInterceptor } from './common/interceptors/unified-response.interceptor';
import { HEALTH_ENDPOINT, METRICS_ENDPOINT } from './constants/url.contants';
import { DtoValidationErrors } from './error-handler/errors/dto-validation.errors';
import { GlobalExceptionFilter } from './error-handler/filters/global-exception.filter';
import { parseValidationErrors } from './error-handler/parsers/validation-error.parser';
import { LoggerService } from './logger/logger.service';
import { loggingMiddleware } from './logger/middlewares/logging.middleware';
import { traceIdMiddleware } from './logger/middlewares/trace-id.middleware';
import { EnvironmentService } from './modules/environment/environment.service';
import { HttpMetricsInterceptor } from './modules/metrics/interceptors/http-metrics.interceptor';
import { sentryContextMiddleware } from './modules/sentry/middlewares/sentry-context.middleware';
import { SentryInterceptor } from './modules/sentry/sentry.interceptor';

export const appSetup = (app: INestApplication): void => {
  const configService = app.get(ConfigService);
  const configApp = configService.getOrThrow<ConfigType<typeof appConfig>>('appConfig');
  const configApi = configService.getOrThrow<ConfigType<typeof apiConfig>>('apiConfig');
  const configLog = configService.getOrThrow<ConfigType<typeof logConfig>>('logConfig');
  const configSentry = configService.getOrThrow<ConfigType<typeof sentryConfig>>('sentryConfig');

  const logger = app.get(LoggerService);
  logger.setAppName(configApp.appName);
  app.useLogger(logger);

  const environmentService = app.get(EnvironmentService);

  // Context (express middleware)
  app.use(httpContext.middleware);

  app.use(traceIdMiddleware);

  if (configSentry.sentryEnabled) {
    app.use(sentryContextMiddleware());
  }

  app.use(loggingMiddleware(configLog, logger));

  // Security & transport middlewares
  if (environmentService.isProduction()) {
    app.use(
      helmet({
        hsts: {
          includeSubDomains: true,
          maxAge: 31536000,
          preload: true,
        },
      }),
    );
  }

  app.use(compression({ threshold: 1024 }));

  // CORS
  app.enableCors({
    credentials: true,
    origin: (origin: string, cb: (a: null, b: boolean) => void) => {
      if (!origin) {
        return configApi.apiAllowNonBrowserOrigins ? cb(null, true) : cb(null, false);
      }

      return configApi.apiAllowedOrigins.includes(origin) ? cb(null, true) : cb(null, false);
    },
  });

  // Routing layer
  app.setGlobalPrefix(configApi.apiPrefix, {
    exclude: [HEALTH_ENDPOINT, METRICS_ENDPOINT, { method: RequestMethod.ALL, path: `${HEALTH_ENDPOINT}/*` }],
  });

  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Class-validator DI (before pipes)
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors: ValidationError[] = []): void => {
        throw new DtoValidationErrors(parseValidationErrors(errors));
      },
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      validationError: { target: false, value: false },
      whitelist: true,
    }),
  );

  // Interceptors
  app.useGlobalInterceptors(
    new SentryInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
    new UnifiedResponseInterceptor({
      excludeEndpoints: [
        `/${METRICS_ENDPOINT}`,
        `/${METRICS_ENDPOINT}/database`,
        `/${HEALTH_ENDPOINT}`,
        `/${HEALTH_ENDPOINT}/deps`,
      ],
    }),
    new HttpMetricsInterceptor(),
  );

  // Filters
  app.useGlobalFilters(new GlobalExceptionFilter(logger, configSentry));

  // Shutdown hooks
  app.enableShutdownHooks();
};
