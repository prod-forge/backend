import { ApiProperty } from '@nestjs/swagger';

import { ErrorCodes } from '../../error-handler/constants/error.codes';

export class ApiErrorDto {
  @ApiProperty({ enum: ErrorCodes })
  code: ErrorCodes;

  @ApiProperty({ required: false })
  details?: unknown;

  @ApiProperty({ example: 'Error message' })
  message: string;

  @ApiProperty({ example: 'trace-id', required: false })
  traceId?: string;
}
