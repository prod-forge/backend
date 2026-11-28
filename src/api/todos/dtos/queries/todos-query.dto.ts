import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { TODOS_MAX_PAGE_SIZE } from '../../../../features/todos/constants/todos.constants';
import { SortOrder, TodoSearchField, TodoSortField } from '../../../../features/todos/interfaces/queries.enum';

export class TodosQueryDto {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;

    if (value === 'false') return false;

    return value;
  })
  completed?: boolean;

  @ApiPropertyOptional({ default: 10, example: 10, maximum: TODOS_MAX_PAGE_SIZE, minimum: 1 })
  @IsInt()
  @IsOptional()
  @Max(TODOS_MAX_PAGE_SIZE)
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ default: 0, example: 0, minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;

  @ApiPropertyOptional({ enum: SortOrder })
  @IsEnum(SortOrder)
  @IsOptional()
  order?: SortOrder;

  @ApiPropertyOptional({ example: 'buy milk', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: TodoSearchField, example: TodoSearchField.TITLE })
  @IsEnum(TodoSearchField)
  @IsOptional()
  searchField?: TodoSearchField;

  @ApiPropertyOptional({ enum: TodoSortField })
  @IsEnum(TodoSortField)
  @IsOptional()
  sortBy?: TodoSortField;
}
