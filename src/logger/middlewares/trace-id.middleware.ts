import type { NextFunction, Request, Response } from 'express';

import { trace } from '@opentelemetry/api';
import { randomUUID } from 'node:crypto';

import { capitalizeFirstLetter } from '../../common/utils/strings';
import { RequestContext } from '../context/request-context';
import { traceIdHeader } from '../headers/trace-id.header';

// An incoming id is echoed into logs and the response header, so only a short token is accepted (a UUID or a 32-hex
// OpenTelemetry trace id fit)
const INCOMING_TRACE_ID = /^[\w-]{1,64}$/;

const readIncomingTraceId = (req: Request): string | undefined => {
  const value = req.headers[traceIdHeader];

  return typeof value === 'string' && INCOMING_TRACE_ID.test(value) ? value : undefined;
};

export const traceIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const traceId = trace.getActiveSpan()?.spanContext().traceId || readIncomingTraceId(req) || randomUUID();
  req.headers[traceIdHeader] = traceId;
  const capitalizedHeader = traceIdHeader.split('-').map(capitalizeFirstLetter).join('-');
  res.setHeader(capitalizedHeader, traceId);

  RequestContext.run(traceId, () => next());
};
