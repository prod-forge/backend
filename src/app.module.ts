import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { join } from 'node:path';

import { AuthController } from './api/auth/auth.controller';
import { apiConfig } from './config/api.config';
import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { databaseConfig } from './config/database.config';
import { environmentConfig } from './config/environment.config';
import { logConfig } from './config/log.config';
import { metricsConfig } from './config/metrics.config';
import { redisConfig } from './config/redis.config';
import { sentryConfig } from './config/sentry.config';
import { swaggerConfig } from './config/swagger.config';
import { throttlerConfig } from './config/throttler.config';
import { METRICS_ENDPOINT } from './constants/url.contants';
import { ClientLogsModule } from './features/client-logs/client-logs.module';
import { TodosModule } from './features/todos/todos.module';
import { UsersModule } from './features/users/users.module';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { EnvironmentModule } from './modules/environment/environment.module';
import { HealthModule } from './modules/health/health.module';
import { RequestTrackingMiddleware } from './modules/in-flight-requests/request-tracking.middleware';
import { RequestTrackingService } from './modules/in-flight-requests/request-tracking.service';
import { MetricsModule } from './modules/metrics/metrics.module';
import { RedisManagerModule } from './modules/redis-manager/redis-manager.module';
import { ThrottlerStorage } from './modules/redis-manager/storages/throttler.storage';
import { SentryModule } from './modules/sentry/sentry.module';
import { ShutdownModule } from './modules/shutdown/shutdown.module';
import { VersionModule } from './modules/version/version.module';

@Module({
  controllers: [AuthController],
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule, RedisManagerModule],
      inject: [ConfigService, ThrottlerStorage],
      useFactory: (configService: ConfigService, throttlerStorage: ThrottlerStorage) => {
        const config = configService.getOrThrow<ConfigType<typeof throttlerConfig>>('throttlerConfig');

        return {
          storage: throttlerStorage,
          throttlers: [
            {
              limit: config.throttlerLimit,
              ttl: config.throttlerTtl,
            },
          ],
        };
      },
    }),
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      path: `/${METRICS_ENDPOINT}`,
    }),
    ConfigModule.forRoot({
      envFilePath: [join(process.cwd(), '.env'), join(process.cwd(), '.env.common')],
      isGlobal: true,
      load: [
        appConfig,
        apiConfig,
        authConfig,
        throttlerConfig,
        redisConfig,
        databaseConfig,
        environmentConfig,
        swaggerConfig,
        metricsConfig,
        sentryConfig,
        logConfig,
      ],
    }),
    MetricsModule,
    LoggerModule,
    ShutdownModule,
    EnvironmentModule,
    RedisManagerModule,
    AuthModule,
    UsersModule,
    ClientLogsModule,
    TodosModule,
    HealthModule,
    SentryModule,
    VersionModule,
  ],
  providers: [
    RequestTrackingService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestTrackingMiddleware).forRoutes('*');
  }
}
