import type { ConfigFactory } from '@nestjs/config';

import { registerAs } from '@nestjs/config';
import { Transform } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';

import { parseBooleanEnv } from '../common/utils/parse-boolean';
import { validateConfig } from '../common/utils/validate-config.util';
import { SwaggerConfigInterface } from './interfaces/swagger-config.interface';

class SwaggerConfig {
  @IsBoolean()
  @Transform(parseBooleanEnv)
  SWAGGER_ENABLED = true;

  @IsString()
  SWAGGER_ENDPOINT = 'docs';
}

export const swaggerConfig = registerAs<SwaggerConfig, ConfigFactory<SwaggerConfigInterface>>(
  'swaggerConfig',
  (): SwaggerConfigInterface => {
    const config = validateConfig(SwaggerConfig);

    return {
      swaggerEnabled: config.SWAGGER_ENABLED,
      swaggerEndpoint: config.SWAGGER_ENDPOINT,
    };
  },
);
