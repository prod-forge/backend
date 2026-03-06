import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

import { SortOrder, TodoSearchField, TodoSortField } from '../../../../features/todos/interfaces/queries.enum';

export class TodosQueryDto {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  completed?: boolean;

  @ApiPropertyOptional({ default: 10, example: 10 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ default: 1, example: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  offset?: number = 1;

  @ApiPropertyOptional({ enum: SortOrder })
  @IsEnum(SortOrder)
  @IsOptional()
  order?: SortOrder;

  @ApiPropertyOptional({ example: 'buy milk' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: TodoSortField, example: TodoSearchField.TITLE })
  @IsEnum(TodoSortField)
  @IsOptional()
  searchField?: string;

  @ApiPropertyOptional({ enum: TodoSortField })
  @IsEnum(TodoSortField)
  @IsOptional()
  sortBy?: TodoSortField;
}
