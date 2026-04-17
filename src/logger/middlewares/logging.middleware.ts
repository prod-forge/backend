import { NextFunction, Request, Response } from 'express';

import { LogConfigInterface } from '../../config/interfaces/log-config.interface';
import { HEALTH_ENDPOINT, METRICS_ENDPOINT } from '../../constants/url.constants';
import { LoggerService } from '../logger.service';

export const loggingMiddleware =
  (config: LogConfigInterface, loggerService: LoggerService) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if ([`/${HEALTH_ENDPOINT}`, `/${METRICS_ENDPOINT}`, ...config.logExcludeEndpoints].includes(req.url)) {
      next();

      return;
    }

    loggerService.log({
      ctx: 'loggingMiddleware',
      details: JSON.stringify(req.body),
      method: req.method,
      msg: `Request income`,
      path: req.url,
    });

    next();
  };
