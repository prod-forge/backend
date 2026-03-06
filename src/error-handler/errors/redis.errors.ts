import { HttpStatus } from '@nestjs/common';

import { ErrorCategory } from '../constants/error-category';
import { ErrorCodes } from '../constants/error.codes';
import { BaseError } from './_base.error';

export class RedisErrors extends BaseError<Error> {
  static code = ErrorCodes.REDIS_ERROR;
  static domain = ErrorCategory.INFRASTRUCTURE;
  static message = 'System Error';
  static status = HttpStatus.INTERNAL_SERVER_ERROR;

  constructor(message: string, details?: Error) {
    super(message || RedisErrors.message, RedisErrors.code, RedisErrors.domain, RedisErrors.status, details);
  }
}
