import type { NextFunction, Request, Response } from 'express';

import { randomUUID } from 'node:crypto';

import { capitalizeFirstLetter } from '../../common/utils/strings';
import { RequestContext } from '../context/request-context';
import { traceIdHeader } from '../headers/trace-id.header';

export const traceIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const traceId = (req.headers && (req.headers[traceIdHeader] as string)) || randomUUID();
  req.headers[traceIdHeader] = traceId;
  const capitalizedHeader = traceIdHeader.split('-').map(capitalizeFirstLetter).join('-');
  res.setHeader(capitalizedHeader, traceId);

  RequestContext.run(traceId, () => next());
};
