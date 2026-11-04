import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PaginationMetaDto {
  @ApiProperty({ example: 10 })
  @Expose()
  limit: number;

  @ApiProperty({ description: 'Zero-based number of rows skipped', example: 0 })
  @Expose()
  offset: number;

  @ApiProperty({ example: 20 })
  @Expose()
  total: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  @Expose()
  data: T[];

  @ApiProperty({ type: PaginationMetaDto })
  @Expose()
  meta: PaginationMetaDto;
}
