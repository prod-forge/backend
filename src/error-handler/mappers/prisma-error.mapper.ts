import type { BaseError } from '../errors/_base.error';

import { Prisma } from '../../../database-manager/generated/client';
import {
  DatabaseForeignKeyError,
  DatabaseNotFoundError,
  DatabaseUniqueConstraintError,
  DatabaseValidationError,
} from '../errors/database.errors';

export function mapPrismaError(err: unknown): BaseError<unknown> | null {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2000':
      case 'P2006':
      case 'P2007':
      case 'P2011':
        return new DatabaseValidationError('Validation Error', err.meta);
      case 'P2002':
        return new DatabaseUniqueConstraintError('Unique constraint failed', err.meta);
      case 'P2003':
        return new DatabaseForeignKeyError('Foreign key constraint failed', err.meta);
      case 'P2025':
        return new DatabaseNotFoundError('Record not found', err.meta);
    }
  }

  return null;
}
