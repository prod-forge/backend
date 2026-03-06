import { Injectable, OnModuleInit } from '@nestjs/common';
import { Gauge, register } from 'prom-client';

import { DatabaseMetrics } from './metrics/database.metrics';

@Injectable()
export class MetricsService implements OnModuleInit {
  private slowQueryGauge: Gauge<string>;

  constructor(private readonly databaseMetrics: DatabaseMetrics) {}

  async getDatabaseMetrics(): Promise<string> {
    await this.updateDatabaseMetrics();

    return register.getSingleMetricAsString('db_slow_query_ms');
  }

  onModuleInit(): void {
    this.slowQueryGauge = new Gauge({
      help: 'Mean execution time of slow queries',
      labelNames: ['query'],
      name: 'db_slow_query_ms',
    });
  }

  async updateDatabaseMetrics(): Promise<void> {
    const queries = await this.databaseMetrics.getTopSlowQueries(10);

    queries.forEach((q) => {
      this.slowQueryGauge.set({ query: q.query }, q.meanMs);
    });
  }
}
