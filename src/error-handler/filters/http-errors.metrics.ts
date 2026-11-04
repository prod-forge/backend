import { Counter } from 'prom-client';

export const httpErrorsTotal = new Counter({
  help: 'Total HTTP errors',
  labelNames: ['method', 'route', 'status'],
  name: 'http_errors_total',
});
