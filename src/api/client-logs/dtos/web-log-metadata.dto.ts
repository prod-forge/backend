import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString, MaxLength } from 'class-validator';

export class WebLogMetadataDto {
  @ApiProperty({ example: 'Chrome', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  browser: string;

  @ApiProperty({ example: '148.0.0.0', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  browserVersion: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  devicePixelRatio: number;

  @ApiProperty({ example: 'http://localhost:5173/todo/abc', maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  fullUrl: string;

  @ApiProperty({ example: 'en-US', maxLength: 35 })
  @IsString()
  @MaxLength(35)
  language: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  mobile: boolean;

  @ApiProperty({ example: 'macOS 10.15.7', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  os: string;

  @ApiProperty({ example: '1728x1117', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  screen: string;

  @ApiProperty({ example: 'Europe/London', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  timezone: string;

  @ApiProperty({ example: '/todo/abc', maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  url: string;

  @ApiProperty({ example: '1046x920', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  viewport: string;
}
