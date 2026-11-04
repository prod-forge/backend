import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export enum WebLogLevel {
  CRITICAL = 'critical',
  DEBUG = 'debug',
  ERROR = 'error',
  INFO = 'info',
  LOG = 'log',
  WARN = 'warn',
}

export class WebLogActionDto {
  @ApiProperty({ description: 'Context or module that produced the action', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  ctx: string;

  @ApiProperty({ enum: WebLogLevel, example: WebLogLevel.INFO })
  @IsEnum(WebLogLevel)
  level: WebLogLevel;

  @ApiProperty({ example: 'Fetching todo', maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  message: string;

  @ApiProperty({ additionalProperties: true, description: 'Arbitrary action payload', type: 'object' })
  @IsObject()
  payload: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Error stack trace', maxLength: 10000 })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  stack?: string;
}
