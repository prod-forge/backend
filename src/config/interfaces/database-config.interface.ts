import { LogLevel } from '../../../database-manager/generated/internal/prismaNamespace';

export interface DatabaseConfigInterface {
  databaseFailFast: boolean;
  databaseLogLevels: LogLevel[];
  databasePassword: string;
  databaseUrl: string;
  databaseUser: string;
}
