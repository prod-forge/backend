import { ApiProperty } from '@nestjs/swagger';

import { ErrorCodes } from '../../error-handler/constants/error.codes';

export class ApiErrorDto {
  @ApiProperty({ enum: ErrorCodes })
  code: ErrorCodes;

  @ApiProperty({ example: 'correlation-id', required: false })
  correlationId?: string;

  @ApiProperty({ required: false })
  details?: unknown;

  @ApiProperty({ example: 'Error message' })
  message: string;
}
