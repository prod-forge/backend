import { HttpException } from '@nestjs/common';

import { BaseError } from '../errors/_base.error';
import { HttpStatusError, InternalServerError } from '../errors/common.errors';
import { mapPrismaError } from './prisma-error.mapper';

const FIRST_SERVER_ERROR_STATUS = 500;

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

export function resolveErrorStatus(exception: unknown): number {
  return resolveError(exception).status;
}
