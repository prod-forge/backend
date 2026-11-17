import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class CreateTodoDto {
  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  // @IsOptional() also skips validation for null, which reaches Prisma and
  // becomes a 500. Only undefined may opt out; null must fail as a 422.
  @ValidateIf((_, value) => value !== undefined)
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
