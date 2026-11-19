import type { Request } from 'express';

import { Counter, Gauge, Histogram } from '@prometheus-io/client';

// The route template for the metrics labels, never the raw URL, so cardinality stays bounded.
export function resolveHttpMetricsRoute(req: Request): string {
  return (req.route as undefined | { path?: string })?.path || req.baseUrl || 'unknown';
}

// HttpMetricsInterceptor records a request when it runs, but Nest runs guards before interceptors, so a
// guard rejection (401, 429) never reaches it. The metrics middleware records those on res finish instead,
// and this set is how the two paths agree on which one recorded a request, so none is counted twice.
const httpMetricsRecordedRequests = new WeakSet<Request>();

export function isHttpMetricsRecorded(req: Request): boolean {
  return httpMetricsRecordedRequests.has(req);
}

export function markHttpMetricsRecorded(req: Request): void {
  httpMetricsRecordedRequests.add(req);
}

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
