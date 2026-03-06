import { HttpStatus } from '@nestjs/common';

import { ErrorCategory } from '../constants/error-category';
import { ErrorCodes } from '../constants/error.codes';
import { BaseError } from './_base.error';

export class TodoNotFoundError extends BaseError<{ id: string }> {
  static code = ErrorCodes.TODO_NOT_FOUND;
  static domain = ErrorCategory.DOMAIN;
  static message = 'Todo not found';
  static status = HttpStatus.NOT_FOUND;

  constructor(id: string) {
    super(TodoNotFoundError.message, TodoNotFoundError.code, TodoNotFoundError.domain, TodoNotFoundError.status, {
      id,
    });
  }
}
