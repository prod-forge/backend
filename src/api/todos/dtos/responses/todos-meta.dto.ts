import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { PaginationMetaDto } from '../../../../shared/dtos/pagination.dto';

export class TodosMetaDto extends PaginationMetaDto {
  @ApiProperty({ description: 'Completed todos among all rows matching the filter, not only this page', example: 5 })
  @Expose()
  completed: number;
}
