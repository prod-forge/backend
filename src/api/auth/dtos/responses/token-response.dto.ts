import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TokenResponseDto {
  @ApiProperty()
  @Expose()
  accessToken: string;

  @ApiProperty({ description: 'Token lifetime in seconds' })
  @Expose()
  expiresIn: number;
}
