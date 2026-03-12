import type { ConfigType } from '@nestjs/config';

import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Inject } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';
import { Counter } from 'prom-client';

import { sentryConfig } from '../../config/sentry.config';
import { HEALTH_ENDPOINT } from '../../constants/url.contants';
import { LoggerService } from '../../logger/logger.service';
import { BaseError } from '../errors/_base.error';
import { InternalServerError } from '../errors/common.errors';
import { frontendMapper } from '../mappers/frontend.mapper';
import { mapPrismaError } from '../mappers/prisma-error.mapper';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly httpErrors = new Counter({
    help: 'Total HTTP errors',
    labelNames: ['method', 'route', 'status'],
    name: 'http_errors_total',
  });

  constructor(
    private readonly loggerService: LoggerService,
    @Inject(sentryConfig.KEY)
    private configSentry: ConfigType<typeof sentryConfig>,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { correlationId: string; userId?: string }>();
    const res = ctx.getResponse<Response>();
    const correlationId = req.correlationId;

    let error: BaseError<unknown> | null = null;

    // 1) Domain errors
    if (exception instanceof BaseError) {
      error = exception;
    }

    // 2) Prisma errors
    if (!error) {
      error = mapPrismaError(exception);
    }

    // 3) Nest HttpException fallback (not show details to user)
    if (!error && exception instanceof HttpException) {
      error = new InternalServerError();
    }

    // 4) Unknown error (not show details to user)
    if (!error) {
      error = new InternalServerError();
    }

    // Need to skip Health endpoint
    if (HEALTH_ENDPOINT === req.url.slice(1) && exception instanceof HttpException) {
      res.status(200).json(exception.getResponse());

      return;
    }

    if (+error.status >= 400) {
      const route = req.route as { path: string };
      this.httpErrors.labels(req.method, route?.path || req.url, error.status.toString()).inc();
    }

    if (this.configSentry.sentryEnabled) {
      const userId = req.userId;

      if (typeof userId === 'string') {
        Sentry.setUser({ userId });
      }

      Sentry.captureException(exception, {
        extra: {
          body: req.body,
          correlationId,
          params: req.params,
          query: req.query,
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
