import { HttpException } from '@nestjs/common';

import { HEALTH_ENDPOINT } from '../../constants/url.constants';
import { BaseError } from '../errors/_base.error';
import { HttpStatusError, InternalServerError } from '../errors/common.errors';
import { mapPrismaError } from './prisma-error.mapper';

const FIRST_SERVER_ERROR_STATUS = 500;

// Health endpoints answer with the Terminus HttpException as is (503 when a check is down, e.g. during shutdown drain).
// Express routing is case-insensitive, so the path is compared lowercased.
export function isHealthPassthrough(path: string, exception: unknown): exception is HttpException {
  const lowerPath = path.toLowerCase();
  const isHealthPath = lowerPath === `/${HEALTH_ENDPOINT}` || lowerPath.startsWith(`/${HEALTH_ENDPOINT}/`);

  return isHealthPath && exception instanceof HttpException;
}

export function resolveError(exception: unknown): BaseError<unknown> {
  if (exception instanceof BaseError) return exception;

  // Framework 4xx (404 route, 429 throttle, 400 body parse) keep their status; 5xx HttpException stays hidden
  if (exception instanceof HttpException) {
    const status: number = exception.getStatus();

    if (status < FIRST_SERVER_ERROR_STATUS) return new HttpStatusError(status);
  }

  // Prisma errors, then anything else is hidden behind a generic 500
  return mapPrismaError(exception) ?? new InternalServerError();
}

// The status the client receives, so metric labels match the response the exception filter sends
export function resolveErrorStatus(exception: unknown, path: string): number {
  if (isHealthPassthrough(path, exception)) return exception.getStatus();

  return resolveError(exception).status;
}
