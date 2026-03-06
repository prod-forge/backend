import { HttpStatus } from '@nestjs/common';

import { ErrorCategory } from '../constants/error-category';
import { ErrorCodes } from '../constants/error.codes';
import { BaseError } from './_base.error';

export class DatabaseNotFoundError extends BaseError<Record<string, unknown>> {
  static code = ErrorCodes.DATABASE_ERROR;
  static domain = ErrorCategory.INFRASTRUCTURE;
  static message = 'Not Found';
  static status = HttpStatus.NOT_FOUND;

  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message || DatabaseNotFoundError.message,
      DatabaseNotFoundError.code,
      DatabaseNotFoundError.domain,
      DatabaseNotFoundError.status,
      details,
    );
  }
}

export class DatabaseUniqueConstraintError extends BaseError<Record<string, unknown>> {
  static code = ErrorCodes.DATABASE_ERROR;
  static domain = ErrorCategory.INFRASTRUCTURE;
  static message = 'Conflict';
  static status = HttpStatus.CONFLICT;

  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message || DatabaseUniqueConstraintError.message,
      DatabaseUniqueConstraintError.code,
      DatabaseUniqueConstraintError.domain,
      DatabaseUniqueConstraintError.status,
      details,
    );
  }
}

export class DatabaseValidationError extends BaseError<Record<string, unknown>> {
  static code = ErrorCodes.DATABASE_ERROR;
  static domain = ErrorCategory.INFRASTRUCTURE;
  static message = 'Validation Error';
  static status = HttpStatus.BAD_REQUEST;

  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message || DatabaseValidationError.message,
      DatabaseValidationError.code,
      DatabaseValidationError.domain,
      DatabaseValidationError.status,
      details,
    );
  }
}
