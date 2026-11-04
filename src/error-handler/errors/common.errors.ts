import { HttpStatus } from '@nestjs/common';
import { STATUS_CODES } from 'node:http';

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

const HTTP_STATUS_CODES: Readonly<Partial<Record<number, ErrorCodes>>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCodes.BAD_REQUEST,
  [HttpStatus.NOT_FOUND]: ErrorCodes.NOT_FOUND,
  [HttpStatus.PAYLOAD_TOO_LARGE]: ErrorCodes.PAYLOAD_TOO_LARGE,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCodes.TOO_MANY_REQUESTS,
};

// Framework-level 4xx (unknown route, malformed body, throttling) keep their status; the message is the generic status text
export class HttpStatusError extends BaseError<void> {
  constructor(status: number) {
    super(
      STATUS_CODES[status] ?? 'Request Error',
      HTTP_STATUS_CODES[status] ?? ErrorCodes.HTTP_EXCEPTION,
      ErrorCategory.APPLICATION,
      status,
    );
  }
}
