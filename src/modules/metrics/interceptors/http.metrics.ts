import { Counter, Gauge, Histogram } from '@prometheus-io/client';

export const httpInFlight = new Gauge({
  help: 'Number of HTTP requests currently being processed',
  name: 'http_requests_in_flight',
});

export const httpRequestDuration = new Histogram({
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  name: 'http_request_duration_seconds',
});

export const httpRequestsTotal = new Counter({
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  name: 'http_requests_total',
});

export const queriesPerRequest = new Histogram({
  buckets: [0, 1, 2, 3, 5, 10, 20, 50],
  help: 'Number of database queries executed per HTTP request',
  name: 'prisma_queries_per_request',
});
