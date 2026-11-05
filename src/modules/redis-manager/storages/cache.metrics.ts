import { Counter } from '@prometheus-io/client';

export const cacheOperationsTotal = new Counter({
  help: 'Cache operations by operation type and result',
  labelNames: ['operation', 'result'],
  name: 'cache_operations_total',
});
