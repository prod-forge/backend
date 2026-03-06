import { HttpStatus } from '@nestjs/common';

import { ErrorCategory } from '../constants/error-category';
import { ErrorCodes } from '../constants/error.codes';
import { BaseError } from './_base.error';

export class UserIsNotAuthorizedError extends BaseError<void> {
  static code = ErrorCodes.USER_IS_NOT_AUTHORIZED;
  static domain = ErrorCategory.DOMAIN;
  static message = 'User is not authorized';
  static status = HttpStatus.UNAUTHORIZED;

  constructor() {
    super(
      UserIsNotAuthorizedError.message,
      UserIsNotAuthorizedError.code,
      UserIsNotAuthorizedError.domain,
      UserIsNotAuthorizedError.status,
    );
  }
}

export class UserNotFoundError extends BaseError<{ id: string }> {
  static code = ErrorCodes.USER_NOT_FOUND;
  static domain = ErrorCategory.DOMAIN;
  static message = 'User not found';
  static status = HttpStatus.NOT_FOUND;

  constructor(id: string) {
    super(UserNotFoundError.message, UserNotFoundError.code, UserNotFoundError.domain, UserNotFoundError.status, {
      id,
    });
  }
}
