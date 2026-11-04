import type { INestApplication } from '@nestjs/common';

import { json, urlencoded } from 'express';

import type { LogConfigInterface } from '../../config/interfaces/log-config.interface';
import type { LoggerService } from '../logger.service';

import { loggingMiddleware } from './logging.middleware';

// Nest adds its own body parsers during init(), after every app.use(). The logging middleware needs req.body,
// so the parsers run first here; body-parser skips a request whose body is already parsed, so Nest's later ones are no-ops.
export const useRequestLogging = (app: INestApplication, config: LogConfigInterface, logger: LoggerService): void => {
  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.use(loggingMiddleware(config, logger));
};
