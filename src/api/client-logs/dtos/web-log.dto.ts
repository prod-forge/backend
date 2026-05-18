import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsDateString, IsString, IsUUID, ValidateNested } from 'class-validator';

import { WebLogActionDto } from './web-log-action.dto';
import { WebLogMetadataDto } from './web-log-metadata.dto';

export class WebLogDto {
  @ApiProperty({ isArray: true, type: () => WebLogActionDto })
  @ArrayNotEmpty()
  @IsArray()
  @Type(() => WebLogActionDto)
  @ValidateNested({ each: true })
  actions: WebLogActionDto[];

  @ApiProperty({ example: 'production' })
  @IsString()
  env: string;

  @ApiProperty({ type: () => WebLogMetadataDto })
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
