import { Injectable, OnModuleInit } from '@nestjs/common';
import { Gauge, register } from 'prom-client';

import { LoggerService } from '../../logger/logger.service';
import { DatabaseMetrics } from './metrics/database.metrics';

const SLOW_QUERY_LIMIT = 10;
const SLOW_QUERY_METRIC = 'db_slow_query_mean_ms';

@Injectable()
export class MetricsService implements OnModuleInit {
  private missingExtensionWarned = false;
  private slowQueryGauge: Gauge<'queryid'>;

  constructor(
    private readonly databaseMetrics: DatabaseMetrics,
    private readonly logger: LoggerService,
  ) {}

  getDatabaseMetrics(): Promise<string> {
    return register.getSingleMetricAsString(SLOW_QUERY_METRIC);
  }

  onModuleInit(): void {
    this.slowQueryGauge = new Gauge({
      collect: (): Promise<void> => this.updateDatabaseMetrics(),
      help: 'Mean execution time in milliseconds of the slowest queries from pg_stat_statements',
      labelNames: ['queryid'],
      name: SLOW_QUERY_METRIC,
    });
  }

  async updateDatabaseMetrics(): Promise<void> {
    let queries;
    try {
      queries = await this.databaseMetrics.getTopSlowQueries(SLOW_QUERY_LIMIT);
    } catch (err) {
      this.handleSlowQueryError(err);

      return;
    }

    this.slowQueryGauge.reset();
    queries.forEach((q) => {
      this.slowQueryGauge.set({ queryid: q.queryId }, q.meanMs);
    });
  }

  private handleSlowQueryError(err: unknown): void {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('pg_stat_statements')) {
      if (!this.missingExtensionWarned) {
        this.missingExtensionWarned = true;
        this.logger.warn({
          ctx: MetricsService.name,
          details: message,
          msg: 'pg_stat_statements is not available, slow query metrics are skipped',
        });
      }

      return;
    }

    this.logger.error({ ctx: MetricsService.name, details: err, msg: 'Failed to refresh slow query metrics' });
  }
}
