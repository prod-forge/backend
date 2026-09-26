import type { Level } from 'pino';

export type LogConfigInterface = {
  logExcludeEndpoints: string[];
  logLevel: Level;
  logPretty: boolean;
};
