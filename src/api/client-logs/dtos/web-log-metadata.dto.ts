import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class WebLogMetadataDto {
  @ApiProperty({ example: 'Chrome' })
  @IsString()
  browser: string;

  @ApiProperty({ example: '148.0.0.0' })
  @IsString()
  browserVersion: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  devicePixelRatio: number;

  @ApiProperty({ example: 'http://localhost:5173/todo/abc' })
  @IsString()
  fullUrl: string;

  @ApiProperty({ example: 'en-US' })
  @IsString()
  language: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  mobile: boolean;

  @ApiProperty({ example: 'macOS 10.15.7' })
  @IsString()
  os: string;

  @ApiProperty({ example: '1728x1117' })
  @IsString()
  screen: string;

  @ApiProperty({ example: 'Europe/London' })
  @IsString()
  timezone: string;

  @ApiProperty({ example: '/todo/abc' })
  @IsString()
  url: string;

  @ApiProperty({ example: '1046x920' })
  @IsString()
  viewport: string;
}
