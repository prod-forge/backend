import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Request } from 'express';
import { catchError, Observable, throwError } from 'rxjs';

import { RequestContext } from '../../logger/context/request-context';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();

    const correlationId = RequestContext.getCorrelationId();

    return next.handle().pipe(
      catchError((err: Error) => {
        Sentry.captureException(err, {
          extra: {
            body: req.body,
            correlationId,
            method: req.method,
            url: req.url,
          },
        });

        return throwError(() => err);
      }),
    );
  }
}
