import Sentry from '@sentry/node';
import { NextFunction, Request, Response } from 'express';

import { RequestContext } from '../../../logger/context/request-context';

export const sentryContextMiddleware =
  () =>
  (req: Request & { userId?: string }, res: Response, next: NextFunction): void => {
    const correlationId = RequestContext.getCorrelationId();

    Sentry.setTag('correlationId', correlationId);
    Sentry.setContext('request', {
      method: req.method,
      url: req.url,
    });

    next();
  };
