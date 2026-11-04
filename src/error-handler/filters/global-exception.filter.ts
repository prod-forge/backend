import type { ConfigType } from '@nestjs/config';

import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Inject } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';

import { sentryConfig } from '../../config/sentry.config';
import { HEALTH_ENDPOINT } from '../../constants/url.contants';
import { LoggerService } from '../../logger/logger.service';
import { frontendMapper } from '../mappers/frontend.mapper';
import { resolveError } from '../mappers/resolve-error';
import { httpErrorsTotal } from './http-errors.metrics';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly loggerService: LoggerService,
    @Inject(sentryConfig.KEY)
    private readonly configSentry: ConfigType<typeof sentryConfig>,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { traceId: string; userId?: string }>();
    const res = ctx.getResponse<Response>();
    const traceId = req.traceId;

    const error = resolveError(exception);

    // Need to skip Health endpoints
    if (req.url.slice(1).startsWith(HEALTH_ENDPOINT) && exception instanceof HttpException) {
      res.status(200).json(exception.getResponse());

      return;
    }

    if (error.status >= HttpStatus.BAD_REQUEST) {
      const route = req.route as undefined | { path: string };
      httpErrorsTotal.labels(req.method, route?.path || req.url, error.status.toString()).inc();
    }

    if (this.configSentry.sentryEnabled) {
      const userId = req.userId;

      if (typeof userId === 'string') {
        Sentry.setUser({ userId });
      }

      Sentry.captureException(exception, {
        extra: {
          body: req.body,
          params: req.params,
          query: req.query,
          traceId,
        },
      });
    }
    const infraError = exception instanceof HttpException;

    this.loggerService.error({
      code: error.code,
      ctx: GlobalExceptionFilter.name,
      details: infraError ? exception.getResponse() : error.details,
      method: req.method,
      msg: error.message,
      path: req.url,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    res.status(error.status).json({
      code: error.code,
      message: error.message,
      status: error.status,
      ...(typeof error.details !== 'undefined' ? { details: frontendMapper(error.details) } : {}),
    });
  }
}
