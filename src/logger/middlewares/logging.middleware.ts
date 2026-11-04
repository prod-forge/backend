import type { NextFunction, Request, Response } from 'express';

import type { LogConfigInterface } from '../../config/interfaces/log-config.interface';
import type { LoggerService } from '../logger.service';

import { HEALTH_ENDPOINT, METRICS_ENDPOINT } from '../../constants/url.constants';

export const loggingMiddleware =
  (config: LogConfigInterface, loggerService: LoggerService) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const isProbe = [HEALTH_ENDPOINT, METRICS_ENDPOINT].some(
      (endpoint) => req.path === `/${endpoint}` || req.path.startsWith(`/${endpoint}/`),
    );

    if (isProbe || config.logExcludeEndpoints.includes(req.url)) {
      next();

      return;
    }

    const entry = {
      ctx: 'loggingMiddleware',
      method: req.method,
      msg: `Request income`,
      path: req.path,
    };

    loggerService.log(entry);

    // The body may hold personal data; it is only emitted at debug level and redacted by the logger
    loggerService.debug({ ...entry, req: { body: req.body } });

    next();
  };
