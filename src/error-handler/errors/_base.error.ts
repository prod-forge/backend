// eslint-disable-next-line check-file/filename-naming-convention
import { HttpStatus } from '@nestjs/common';

import { ErrorCategory } from '../constants/error-category';
import { ErrorCodes } from '../constants/error.codes';

export class BaseError<T> extends Error {
  constructor(
    public readonly message: string,
    public readonly code: ErrorCodes,
    public readonly category: ErrorCategory,
    public readonly status: HttpStatus,
    public readonly details?: T,
  ) {
    super(message);
  }
}
