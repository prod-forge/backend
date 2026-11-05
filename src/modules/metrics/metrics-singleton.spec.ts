import { register } from '@prometheus-io/client';

import type { LoggerService } from '../../logger/logger.service';
import type { DatabaseMetrics } from './metrics/database.metrics';

import { GlobalExceptionFilter } from '../../error-handler/filters/global-exception.filter';
import { HttpMetricsInterceptor } from './interceptors/http-metrics.interceptor';
import { MetricsService } from './metrics.service';

describe('custom metrics registration', () => {
  describe('negative cases', () => {
    it('can build the interceptor, filter and service twice without "already registered" errors', () => {
      const build = (): void => {
        new HttpMetricsInterceptor();
        new GlobalExceptionFilter({} as LoggerService, {
          sentryDsn: '',
          sentryEnabled: false,
          sentryIgnoredErrors: [],
        });
        new MetricsService({} as DatabaseMetrics, {} as LoggerService).onModuleInit();
      };

      expect(() => {
        build();
        build();
      }).not.toThrow();
    });
  });

  describe('positive cases', () => {
    it('registers each custom metric once', () => {
      const names = [
        'http_requests_total',
        'http_request_duration_seconds',
        'http_requests_in_flight',
        'http_errors_total',
        'prisma_queries_per_request',
        'prisma_query_duration_seconds',
        'prisma_queries_total',
        'db_slow_query_mean_ms',
      ];

      names.forEach((name) => expect(register.getSingleMetric(name)).toBeDefined());
    });
  });
});
