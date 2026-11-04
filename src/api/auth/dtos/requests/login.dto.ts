import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user1@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;
}
