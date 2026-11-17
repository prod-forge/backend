import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { TodoResponseDto } from './todo-response.dto';
import { TodosMetaDto } from './todos-meta.dto';

export class TodosResponseDto {
  @ApiProperty({ type: [TodoResponseDto] })
  @Expose()
  @Type(() => TodoResponseDto)
  data: TodoResponseDto[];

  @ApiProperty({ type: TodosMetaDto })
  @Expose()
  @Type(() => TodosMetaDto)
  meta: TodosMetaDto;
}
