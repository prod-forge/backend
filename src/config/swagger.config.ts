import { registerAs } from '@nestjs/config';
import { ConfigFactory } from '@nestjs/config/dist/interfaces';
import { Transform } from 'class-transformer';
import { IsBoolean, IsString } from 'class-validator';

import { validateConfig } from '../common/utils/validate-config.util';
import { SwaggerConfigInterface } from './interfaces/swagger-config.interface';

class SwaggerConfig {
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  SWAGGER_ENABLED = true;

  @IsString()
  SWAGGER_ENDPOINT = 'docs';

  @IsString()
  SWAGGER_PASSWORD = 'admin';

  @IsString()
  SWAGGER_USERNAME = 'admin';
}

export const swaggerConfig = registerAs<SwaggerConfig, ConfigFactory<SwaggerConfigInterface>>(
  'swaggerConfig',
  (): SwaggerConfigInterface => {
    const config = validateConfig(SwaggerConfig);

    return {
      swaggerEnabled: config.SWAGGER_ENABLED,
      swaggerEndpoint: config.SWAGGER_ENDPOINT,
      swaggerPassword: config.SWAGGER_PASSWORD,
      swaggerUsername: config.SWAGGER_USERNAME,
    };
  },
);
