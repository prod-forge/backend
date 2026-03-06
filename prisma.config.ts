import { config } from 'dotenv';
import { join } from 'node:path';
import { defineConfig } from 'prisma/config';

import { getDatabaseUrl } from './database-manager/generate-url';

config({
  override: false,
  path: [join(process.cwd(), '.env'), join(process.cwd(), '.env.common')],
});

export default defineConfig({
  datasource: {
    url: getDatabaseUrl(),
  },
  migrations: {
    path: 'database-manager/migrations',
    seed: 'tsx ./database-manager/seeds/run-seeds.ts',
  },
  schema: 'database-manager/schema.prisma',
});
