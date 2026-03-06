import { registerAs } from '@nestjs/config';
import { ConfigFactory } from '@nestjs/config/dist/interfaces';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsString } from 'class-validator';

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
}

export const apiConfig = registerAs<ApiConfig, ConfigFactory<ApiConfigInterface>>(
  'apiConfig',
  (): ApiConfigInterface => {
    const config = validateConfig(ApiConfig);

    return {
      apiAllowedOrigins: config.API_ALLOWED_ORIGINS,
      apiAllowNonBrowserOrigins: config.API_ALLOWED_NON_BROWSER_ORIGINS,
      apiPrefix: config.API_PREFIX,
    };
  },
);
