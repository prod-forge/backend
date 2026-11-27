import type { ConfigFactory } from '@nestjs/config';

import { registerAs } from '@nestjs/config';
import { Transform } from 'class-transformer';
import { IsInt, IsString, Min, MinLength } from 'class-validator';

import { toNumber, validateConfig } from '../common/utils/validate-config.util';
import { AuthConfigInterface } from './interfaces/auth-config.interface';

class AuthConfig {
  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsInt()
  @Min(1)
  @Transform(toNumber)
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
