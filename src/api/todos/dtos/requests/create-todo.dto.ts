import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class CreateTodoDto {
  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @ValidateIf((_, value) => value !== undefined)
  completed?: boolean;

  @ApiPropertyOptional({ maxLength: 2000, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;
}
