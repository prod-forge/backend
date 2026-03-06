import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Gauge } from 'prom-client';

import { HealthChecks } from './health.checks';

@Injectable()
export class HealthMetricsService {
  constructor(
    private healthChecks: HealthChecks,
    @InjectMetric('service_health_status')
    private gauge: Gauge<string>,
  ) {}

  async updateMetrics(): Promise<void> {
    let result;
    try {
      result = await this.healthChecks.run();
    } catch (e) {
      if (e instanceof Object) {
        const { response } = e as { response: Record<string, unknown> };
        result = response;
      }
    } finally {
      if (result && result.details) {
        Object.entries(result.details).forEach(([service, data]: [string, Record<string, string>]) => {
          const isUp = data.status === 'up';
          this.gauge.set({ service }, isUp ? 1 : 0);
        });
      }
    }
  }
}
