import { registerAs } from '@nestjs/config';
import { ConfigFactory } from '@nestjs/config/dist/interfaces';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsNumber, IsString } from 'class-validator';

import { getDatabaseUrl } from '../../database-manager/generate-url';
import { LogLevel } from '../../database-manager/generated/internal/prismaNamespace';
import { validateConfig } from '../common/utils/validate-config.util';
import { DatabaseConfigInterface } from './interfaces/database-config.interface';

class DatabaseConfig {
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  DATABASE_FAIL_FAST = true;

  @IsArray()
  @IsIn(['info', 'query', 'warn', 'error'], { each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value as LogLevel[];

    if (typeof value === 'string') {
      return JSON.parse(value) as LogLevel[];
    }

    return [];
  })
  DATABASE_LOG_LEVELS: LogLevel[] = [];

  @IsString()
  DATABASE_NAME: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  DATABASE_PORT: number;

  @IsString()
  DATABASE_USER: string;
}

export const databaseConfig = registerAs<DatabaseConfig, ConfigFactory<DatabaseConfigInterface>>(
  'databaseConfig',
  (): DatabaseConfigInterface => {
    const config = validateConfig(DatabaseConfig);

    return {
      databaseFailFast: config.DATABASE_FAIL_FAST,
      databaseLogLevels: config.DATABASE_LOG_LEVELS,
      databasePassword: config.DATABASE_PASSWORD,
      databaseUrl: getDatabaseUrl(),
      databaseUser: config.DATABASE_USER,
    };
  },
);
