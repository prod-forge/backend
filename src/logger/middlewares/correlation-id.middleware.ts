import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

import { capitalizeFirstLetter } from '../../common/utils/strings';
import { RequestContext } from '../context/request-context';
import { correlationIdHeader } from '../headers/correlation-id.header';

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = (req.headers && (req.headers[correlationIdHeader] as string)) || randomUUID();
  req.headers[correlationIdHeader] = correlationId;
  const capitalizedHeader = correlationIdHeader.split('-').map(capitalizeFirstLetter).join('-');
  res.setHeader(capitalizedHeader, correlationId);

  RequestContext.run(correlationId, () => next());
};
