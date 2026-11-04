import { registerAs } from '@nestjs/config';
import { ConfigFactory } from '@nestjs/config/dist/interfaces';
import { Transform } from 'class-transformer';
import { IsNumber, IsString, MinLength } from 'class-validator';

import { validateConfig } from '../common/utils/validate-config.util';
import { AuthConfigInterface } from './interfaces/auth-config.interface';

class AuthConfig {
  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  JWT_TTL = 3600;
}

export const authConfig = registerAs<AuthConfig, ConfigFactory<AuthConfigInterface>>(
  'authConfig',
  (): AuthConfigInterface => {
    const config = validateConfig(AuthConfig);

    return {
      jwtSecret: config.JWT_SECRET,
      jwtTtl: config.JWT_TTL,
    };
  },
);
