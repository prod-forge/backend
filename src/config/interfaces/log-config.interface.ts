import type { Level } from 'pino';

export interface LogConfigInterface {
  logExcludeEndpoints: string[];
  logLevel: Level;
  logPretty: boolean;
}
