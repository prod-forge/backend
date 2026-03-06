import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';

export class TodoResponseDto {
  @ApiProperty()
  @Expose()
  @IsBoolean()
  @Type(() => Boolean)
  completed?: boolean;

  @ApiProperty({ nullable: true, required: false })
  @Expose()
  @IsString()
  description?: null | string;

  @ApiProperty()
  @Expose()
  @IsString()
  id: string;

  @ApiProperty()
  @Expose()
  @IsString()
  title: string;

  @ApiProperty()
  @Expose()
  @IsString()
  userName: string;
}
