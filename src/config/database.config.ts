import type { ConfigFactory } from '@nestjs/config';

import { registerAs } from '@nestjs/config';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsNumber, IsString } from 'class-validator';

import { getDatabaseUrl } from '../../database-manager/generate-url';
import { LogLevel } from '../../database-manager/generated/internal/prismaNamespace';
import { validateConfig } from '../common/utils/validate-config.util';
import { DatabaseConfigInterface } from './interfaces/database-config.interface';

class DatabaseConfig {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  DATABASE_CONNECT_TIMEOUT_MS = 5000;

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
  @Type(() => String)
  DATABASE_LOG_LEVELS: LogLevel[] = [];

  @IsString()
  DATABASE_NAME: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  DATABASE_POOL_MAX = 10;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  DATABASE_PORT: number;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  DATABASE_STATEMENT_TIMEOUT_MS = 5000;

  @IsString()
  DATABASE_USER: string;
}

export const databaseConfig = registerAs<DatabaseConfig, ConfigFactory<DatabaseConfigInterface>>(
  'databaseConfig',
  (): DatabaseConfigInterface => {
    const config = validateConfig(DatabaseConfig);

    return {
      databaseConnectTimeoutMs: config.DATABASE_CONNECT_TIMEOUT_MS,
      databaseFailFast: config.DATABASE_FAIL_FAST,
      databaseLogLevels: config.DATABASE_LOG_LEVELS,
      databasePassword: config.DATABASE_PASSWORD,
      databasePoolMax: config.DATABASE_POOL_MAX,
      databaseStatementTimeoutMs: config.DATABASE_STATEMENT_TIMEOUT_MS,
      databaseUrl: getDatabaseUrl(),
      databaseUser: config.DATABASE_USER,
    };
  },
);
