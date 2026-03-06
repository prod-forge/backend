import { HttpStatus } from '@nestjs/common';

import { ErrorCategory } from '../constants/error-category';
import { ErrorCodes } from '../constants/error.codes';
import { BaseError } from './_base.error';

export class ForbiddenError extends BaseError<void> {
  static code = ErrorCodes.FORBIDDEN;
  static domain = ErrorCategory.DOMAIN;
  static message = 'Forbidden';
  static status = HttpStatus.FORBIDDEN;

  constructor() {
    super(ForbiddenError.message, ForbiddenError.code, ForbiddenError.domain, ForbiddenError.status);
  }
}

export class InternalServerError extends BaseError<void> {
  static code = ErrorCodes.INTERNAL_ERROR;
  static domain = ErrorCategory.APPLICATION;
  static message = 'Internal Server Error';
  static status = HttpStatus.INTERNAL_SERVER_ERROR;

  constructor() {
    super(
      InternalServerError.message,
      InternalServerError.code,
      InternalServerError.domain,
      InternalServerError.status,
    );
  }
}
