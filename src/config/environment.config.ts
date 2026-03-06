import { registerAs } from '@nestjs/config';
import { ConfigFactory } from '@nestjs/config/dist/interfaces';
import { IsEnum } from 'class-validator';

import { validateConfig } from '../common/utils/validate-config.util';
import { EnvironmentType } from './enums/environment.enum';
import { EnvironmentConfigInterface } from './interfaces/environment-config.interface';

class EnvironmentConfig {
  @IsEnum(EnvironmentType)
  NODE_ENV: EnvironmentType = EnvironmentType.development;
}

export const environmentConfig = registerAs<EnvironmentConfig, ConfigFactory<EnvironmentConfigInterface>>(
  'environmentConfig',
  (): EnvironmentConfigInterface => {
    const config = validateConfig(EnvironmentConfig);

    return {
      env: config.NODE_ENV,
    };
  },
);
