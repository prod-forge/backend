import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateTodoDto {
  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  completed?: boolean = false;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  title: string;
}
