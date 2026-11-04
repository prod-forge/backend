import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTodoDto {
  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  completed?: boolean = false;

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
