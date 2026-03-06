import { registerAs } from '@nestjs/config';
import { ConfigFactory } from '@nestjs/config/dist/interfaces';
import { Transform } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

import packageJson from '../../package.json';
import { validateConfig } from '../common/utils/validate-config.util';
import { AppConfigInterface } from './interfaces/app-config.interface';

class AppConfig {
  @IsString()
  APP_DESCRIPTION = packageJson.description || 'Description';

  @IsString()
  APP_HOST = '0.0.0.0';

  @IsString()
  APP_NAME = packageJson.name || 'App';

  @IsNumber()
  @Transform(({ value }) => Number(value))
  APP_PORT = 3000;

  @IsString()
  APP_VERSION = packageJson.version || '1.0.0';
}

export const appConfig = registerAs<AppConfig, ConfigFactory<AppConfigInterface>>(
  'appConfig',
  (): AppConfigInterface => {
    const config = validateConfig(AppConfig);

    return {
      appDescription: config.APP_DESCRIPTION,
      appHost: config.APP_HOST,
      appName: config.APP_NAME,
      appPort: config.APP_PORT,
      appVersion: config.APP_VERSION,
    };
  },
);
