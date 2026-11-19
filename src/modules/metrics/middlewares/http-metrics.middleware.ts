import type { NextFunction, Request, Response } from 'express';

import {
  httpRequestDuration,
  httpRequestsTotal,
  isHttpMetricsRecorded,
  markHttpMetricsRecorded,
  resolveHttpMetricsRoute,
} from '../interceptors/http.metrics';

// Nest runs guards before interceptors, so a request rejected by a guard (401 from AuthGuard, 429 from
// UserThrottlerGuard) never reaches HttpMetricsInterceptor. This middleware runs before the guards and
// records those requests on res finish instead, with the real status and the same route label the
// interceptor uses. Requests the interceptor already recorded are skipped, so none is counted twice.
export const httpMetricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime();

  res.on('finish', () => {
    if (isHttpMetricsRecorded(req)) return;

    const route = resolveHttpMetricsRoute(req);

    // No route matched (unmatched 404, gated metrics 404): the interceptor never records those either,
    // so there is nothing to catch up on here.
    if (route === 'unknown') return;

    // Mark first so a second finish event cannot record the same request again.
    markHttpMetricsRecorded(req);

    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;
    const status = res.statusCode.toString();

    httpRequestsTotal.labels(req.method, route, status).inc();
    httpRequestDuration.labels(req.method, route, status).observe(duration);
  });

  next();
};
