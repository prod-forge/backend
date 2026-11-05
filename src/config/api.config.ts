import type { ConfigFactory } from '@nestjs/config';

import { registerAs } from '@nestjs/config';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsString } from 'class-validator';

import { validateConfig } from '../common/utils/validate-config.util';
import { ApiConfigInterface } from './interfaces/api-config.interface';

class ApiConfig {
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  API_ALLOWED_NON_BROWSER_ORIGINS = true;

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value as string[];

    if (typeof value === 'string') {
      return JSON.parse(value) as string[];
    }

    return [];
  })
  API_ALLOWED_ORIGINS: string[] = [];

  @IsString()
  API_PREFIX = 'api';

  @IsNumber()
  @Transform(({ value }) => Number(value))
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
