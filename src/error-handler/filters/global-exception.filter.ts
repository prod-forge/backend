import type { ConfigType } from '@nestjs/config';

import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Inject } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';

import { sentryConfig } from '../../config/sentry.config';
import { RequestContext } from '../../logger/context/request-context';
import { LoggerService } from '../../logger/logger.service';
import { frontendMapper } from '../mappers/frontend.mapper';
import { isHealthPassthrough, resolveError } from '../mappers/resolve-error';
import { httpErrorsTotal, UNMATCHED_ROUTE } from './http-errors.metrics';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly loggerService: LoggerService,
    @Inject(sentryConfig.KEY)
    private readonly configSentry: ConfigType<typeof sentryConfig>,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { userId?: string }>();
    const res = ctx.getResponse<Response>();
    const traceId = RequestContext.getTraceId();

    const error = resolveError(exception);

    if (isHealthPassthrough(req.path, exception)) {
      res.status(exception.getStatus()).json(exception.getResponse());

      return;
    }

    if (error.status >= HttpStatus.BAD_REQUEST) {
      const route = req.route as undefined | { path?: string };
      httpErrorsTotal.labels(req.method, route?.path || UNMATCHED_ROUTE, error.status.toString()).inc();
    }

    // Only incidents go to Sentry: 5xx and unexpected errors, never domain 4xx
    if (this.configSentry.sentryEnabled && error.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const userId = req.userId;

      if (typeof userId === 'string') {
        Sentry.setUser({ userId });
      }

      Sentry.captureException(exception, {
        // No request body: it can hold personal data (the login body carries the email)
        extra: {
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
