import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { resolveErrorStatus } from '../../../error-handler/mappers/resolve-error';
import { RequestContext } from '../../../logger/context/request-context';
import { httpInFlight, httpRequestDuration, httpRequestsTotal, queriesPerRequest } from './http.metrics';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  intercept<T>(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<Request>();
    const res = httpContext.getResponse<Response>();

    const method = req.method;
    const route = (req.route as undefined | { path?: string })?.path || req.baseUrl || 'unknown';

    const start = process.hrtime();
    let recorded = false;
    const record = (status: number): void => {
      if (recorded) return;
      recorded = true;
      this.recordMetrics(method, route, status, start);
    };

    httpInFlight.inc();

    return next.handle().pipe(
      catchError((err: unknown) => {
        record(resolveErrorStatus(err, req.path));
        throw err;
      }),
      finalize(() => {
        record(res.statusCode);
        httpInFlight.dec();
        queriesPerRequest.observe(RequestContext.getQueryCount());
      }),
    );
  }

  private recordMetrics(method: string, route: string, status: number, start: [number, number]): void {
    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;

    const statusStr = status.toString();

    httpRequestsTotal.labels(method, route, statusStr).inc();
    httpRequestDuration.labels(method, route, statusStr).observe(duration);
  }
}
