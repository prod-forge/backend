import type { NextFunction, Request, Response } from 'express';

import Sentry from '@sentry/node';

import { RequestContext } from '../../../logger/context/request-context';

export const sentryContextMiddleware =
  () =>
  (req: Request & { userId?: string }, res: Response, next: NextFunction): void => {
    const traceId = RequestContext.getTraceId();

    Sentry.setTag('traceId', traceId);
    Sentry.setContext('request', {
      method: req.method,
      url: req.url,
    });

    next();
  };
