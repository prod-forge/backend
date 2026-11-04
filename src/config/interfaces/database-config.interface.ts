import type { LogLevel } from '../../../database-manager/generated/internal/prismaNamespace';

export type DatabaseConfigInterface = {
  databaseConnectTimeoutMs: number;
  databaseFailFast: boolean;
  databaseLogLevels: LogLevel[];
  databasePassword: string;
  databasePoolMax: number;
  databaseStatementTimeoutMs: number;
  databaseUrl: string;
  databaseUser: string;
};
