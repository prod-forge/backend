import { HttpStatus } from '@nestjs/common';

import { ErrorCategory } from '../constants/error-category';
import { ErrorCodes } from '../constants/error.codes';
import { BaseError } from './_base.error';

export class DtoValidationErrors extends BaseError<Record<string, string[]>> {
  static code = ErrorCodes.DTO_VALIDATION_ERROR;
  static domain = ErrorCategory.VALIDATION;
  static message = 'Validation Error';
  static status = HttpStatus.UNPROCESSABLE_ENTITY;

  constructor(details: Record<string, string[]>) {
    super(
      DtoValidationErrors.message,
      DtoValidationErrors.code,
      DtoValidationErrors.domain,
      DtoValidationErrors.status,
      details,
    );
  }
}
