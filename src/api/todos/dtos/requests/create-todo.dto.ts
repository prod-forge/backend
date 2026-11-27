import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

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

  @ApiProperty({ maxLength: 200, minLength: 1 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  title: string;
}
