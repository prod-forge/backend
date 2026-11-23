import type { ConfigFactory } from '@nestjs/config';

import { registerAs } from '@nestjs/config';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsString, Min } from 'class-validator';

import { parseJsonArray } from '../common/utils/json';
import { toNumber, validateConfig } from '../common/utils/validate-config.util';
import { ApiConfigInterface } from './interfaces/api-config.interface';

class ApiConfig {
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  API_ALLOWED_NON_BROWSER_ORIGINS = true;

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => parseJsonArray(value))
  API_ALLOWED_ORIGINS: string[] = [];

  @IsString()
  API_PREFIX = 'api';

  @IsInt()
  @Min(0)
  @Transform(toNumber)
  TRUST_PROXY = 0;
}

export const apiConfig = registerAs<ApiConfig, ConfigFactory<ApiConfigInterface>>(
  'apiConfig',
  (): ApiConfigInterface => {
    const config = validateConfig(ApiConfig);

    return {
      apiAllowedOrigins: config.API_ALLOWED_ORIGINS,
      apiAllowNonBrowserOrigins: config.API_ALLOWED_NON_BROWSER_ORIGINS,
      apiPrefix: config.API_PREFIX,
      trustProxy: config.TRUST_PROXY,
    };
  },
);
