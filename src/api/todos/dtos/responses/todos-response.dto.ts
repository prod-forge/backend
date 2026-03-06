import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { PaginationMetaDto } from '../../../../shared/dtos/pagination.dto';
import { TodoResponseDto } from './todo-response.dto';

export class TodosResponseDto {
  @ApiProperty({ type: [TodoResponseDto] })
  @Expose()
  @Type(() => TodoResponseDto)
  data: TodoResponseDto[];

  @ApiProperty()
  @Expose()
  meta: PaginationMetaDto;
}
