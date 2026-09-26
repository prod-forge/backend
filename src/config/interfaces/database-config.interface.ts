import type { LogLevel } from '../../../database-manager/generated/internal/prismaNamespace';

export type DatabaseConfigInterface = {
  databaseFailFast: boolean;
  databaseLogLevels: LogLevel[];
  databasePassword: string;
  databaseUrl: string;
  databaseUser: string;
};
