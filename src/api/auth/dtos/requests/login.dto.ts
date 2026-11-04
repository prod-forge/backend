import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user1@example.com', maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email: string;
}
