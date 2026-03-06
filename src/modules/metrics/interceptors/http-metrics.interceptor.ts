import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Counter, Gauge, Histogram } from 'prom-client';
import { Observable } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { BaseError } from '../../../error-handler/errors/_base.error';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  private readonly httpInFlight = new Gauge({
    help: 'Number of HTTP requests currently being processed',
    name: 'http_requests_in_flight',
  });

  private readonly httpRequestDuration = new Histogram({
    buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status'],
    name: 'http_request_duration_seconds',
  });

  private readonly httpRequestsTotal = new Counter({
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status'],
    name: 'http_requests_total',
  });

  intercept<T>(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<Request>();
    const res = httpContext.getResponse<Response>();

    const method = req.method;

    const r = req.route as { path: string };
    const route = r.path || req.baseUrl || 'unknown';

    const start = process.hrtime();
    this.httpInFlight.inc();

    return next.handle().pipe(
      catchError((err: BaseError<unknown>) => {
        const status = err?.status || 500;
        this.recordMetrics(method, route, status, start);
        throw err;
      }),
      finalize(() => {
        const status = res.statusCode;
        this.recordMetrics(method, route, status, start);
      }),
    );
  }

  private recordMetrics(method: string, route: string, status: number, start: [number, number]): void {
    this.httpInFlight.dec();

    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;

    const statusStr = status.toString();

    this.httpRequestsTotal.labels(method, route, statusStr).inc();
    this.httpRequestDuration.labels(method, route, statusStr).observe(duration);
  }
}
