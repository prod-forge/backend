import { Injectable, OnModuleInit } from '@nestjs/common';

import { LoggerService } from '../../logger/logger.service';
import { DatabaseMetricInterface } from './interfaces/database-metric.interface';
import { DatabaseMetrics } from './metrics/database.metrics';
import { setSlowQueryRefresher, slowQueryMeanMs } from './metrics/slow-query.metrics';

const SLOW_QUERY_LIMIT = 10;

@Injectable()
export class MetricsService implements OnModuleInit {
  private missingExtensionWarned = false;

  constructor(
    private readonly databaseMetrics: DatabaseMetrics,
    private readonly logger: LoggerService,
  ) {}

  getDatabaseMetrics(): Promise<DatabaseMetricInterface[]> {
    return this.fetchSlowQueries();
  }

  onModuleInit(): void {
    setSlowQueryRefresher(() => this.updateDatabaseMetrics());
  }

  async updateDatabaseMetrics(): Promise<void> {
    const queries = await this.fetchSlowQueries();

    slowQueryMeanMs.reset();
    queries.forEach((q) => {
      slowQueryMeanMs.set({ queryid: q.queryId }, q.meanMs);
    });
  }

  private async fetchSlowQueries(): Promise<DatabaseMetricInterface[]> {
    try {
      return await this.databaseMetrics.getTopSlowQueries(SLOW_QUERY_LIMIT);
    } catch (err) {
      this.handleSlowQueryError(err);

      return [];
    }
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
