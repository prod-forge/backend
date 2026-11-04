import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsDefined,
  IsObject,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { WebLogActionDto } from './web-log-action.dto';
import { WebLogMetadataDto } from './web-log-metadata.dto';

export class WebLogDto {
  @ApiProperty({ isArray: true, maxItems: 100, type: () => WebLogActionDto })
  @ArrayMaxSize(100)
  @ArrayNotEmpty()
  @IsArray()
  @Type(() => WebLogActionDto)
  @ValidateNested({ each: true })
  actions: WebLogActionDto[];

  @ApiProperty({ example: 'production', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  env: string;

  @ApiProperty({ required: true, type: () => WebLogMetadataDto })
  @IsDefined()
  @IsObject()
  @Type(() => WebLogMetadataDto)
  @ValidateNested()
  metadata: WebLogMetadataDto;

  @ApiProperty({ example: '2026-05-18T08:16:13.163Z' })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ example: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae' })
  @IsUUID()
  traceId: string;
}
