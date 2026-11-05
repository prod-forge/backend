import { Counter } from '@prometheus-io/client';

// Fixed label for requests that matched no route; the raw url would create unbounded label cardinality
export const UNMATCHED_ROUTE = 'unmatched';

export const httpErrorsTotal = new Counter({
  help: 'Total HTTP errors',
  labelNames: ['method', 'route', 'status'],
  name: 'http_errors_total',
});
