import { Prisma } from '../../../database-manager/generated/client';
import { BaseError } from '../errors/_base.error';
import {
  DatabaseNotFoundError,
  DatabaseUniqueConstraintError,
  DatabaseValidationError,
} from '../errors/database.errors';

export function mapPrismaError(err: unknown): BaseError<Error | Record<string, unknown> | void> | null {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return new DatabaseUniqueConstraintError('Unique constraint failed', err.meta);
      case 'P2007':
        return new DatabaseValidationError('Validation Error', err.meta);
      case 'P2025':
        return new DatabaseNotFoundError('Record not found', err.meta);
    }
  }

  return null;
}
