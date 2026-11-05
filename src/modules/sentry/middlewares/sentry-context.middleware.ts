import type { NextFunction, Request, Response } from 'express';

import * as Sentry from '@sentry/node';

import { RequestContext } from '../../../logger/context/request-context';

export const sentryContextMiddleware =
  () =>
  (req: Request & { userId?: string }, res: Response, next: NextFunction): void => {
    const traceId = RequestContext.getTraceId();

    Sentry.setTag('traceId', traceId);
    // The path, never req.url: the query string can carry user-typed text
    Sentry.setContext('request', {
      method: req.method,
      path: req.path,
    });

    next();
  };
