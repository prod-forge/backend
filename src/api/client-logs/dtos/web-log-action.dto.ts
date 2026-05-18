import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsString } from 'class-validator';

export enum WebLogLevel {
  CRITICAL = 'critical',
  DEBUG = 'debug',
  ERROR = 'error',
  INFO = 'info',
  LOG = 'log',
  WARN = 'warn',
}

export class WebLogActionDto {
  @ApiProperty({ description: 'Context or module that produced the action' })
  @IsString()
  ctx: string;

  @ApiProperty({ enum: WebLogLevel, example: WebLogLevel.INFO })
  @IsEnum(WebLogLevel)
  level: WebLogLevel;

  @ApiProperty({ example: 'Fetching todo' })
  @IsString()
  message: string;

  @ApiProperty({ additionalProperties: true, description: 'Arbitrary action payload', type: 'object' })
  @IsObject()
  payload: Record<string, unknown>;
}
