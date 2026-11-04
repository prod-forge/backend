import { BaseError } from '../errors/_base.error';
import { InternalServerError } from '../errors/common.errors';
import { mapPrismaError } from './prisma-error.mapper';

export function resolveError(exception: unknown): BaseError<unknown> {
  if (exception instanceof BaseError) return exception;

  // Prisma errors, then anything else (including Nest HttpException) is hidden behind a generic 500
  return mapPrismaError(exception) ?? new InternalServerError();
}

export function resolveErrorStatus(exception: unknown): number {
  return resolveError(exception).status;
}
