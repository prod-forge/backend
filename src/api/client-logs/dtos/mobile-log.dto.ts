import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsObject, IsString, IsUUID } from 'class-validator';

export class MobileLogDto {
  @ApiProperty({ additionalProperties: true, description: 'Arbitrary log payload — structure TBD', type: 'object' })
  @IsObject()
  payload: Record<string, unknown>;

  @ApiProperty({ description: 'Mobile platform', example: 'ios' })
  @IsString()
  platform: string;

  @ApiProperty({ example: '2026-05-18T08:16:13.163Z' })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ example: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae' })
  @IsUUID()
  traceId: string;
}
