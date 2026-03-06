import type { Level } from 'pino';

import { registerAs } from '@nestjs/config';
import { ConfigFactory } from '@nestjs/config/dist/interfaces';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsString } from 'class-validator';

import { validateConfig } from '../common/utils/validate-config.util';
import { LogLevelEnum } from './enums/log-level.enum';
import { LogConfigInterface } from './interfaces/log-config.interface';

class LogConfig {
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value as string[];

    if (typeof value === 'string') {
      return JSON.parse(value) as string[];
    }

    return [];
  })
  LOG_EXCLUDE_ENDPOINTS: string[] = [];

  @IsEnum(LogLevelEnum)
  LOG_LEVEL: Level = LogLevelEnum.info;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  LOG_PRETTY = true;
}

export const logConfig = registerAs<LogConfig, ConfigFactory<LogConfigInterface>>(
  'logConfig',
  (): LogConfigInterface => {
    const config = validateConfig(LogConfig);

    return {
      logExcludeEndpoints: config.LOG_EXCLUDE_ENDPOINTS,
      logLevel: config.LOG_LEVEL,
      logPretty: config.LOG_PRETTY,
    };
  },
);
