import { config } from 'dotenv';
import { join } from 'node:path';
import { defineConfig } from 'prisma/config';

import { getDatabaseUrl } from './database-manager/generate-url';

config({
  override: false,
  path: [join(process.cwd(), '.env'), join(process.cwd(), '.env.common')],
});

// eslint-disable-next-line @import-lite/no-default-export
export default defineConfig({
  datasource: {
    // The schema engine's sslmode=require encrypts without verifying the certificate; verify-full is not one of its documented modes.
    url: getDatabaseUrl('require'),
  },
  migrations: {
    path: 'database-manager/migrations',
    seed: 'tsx ./database-manager/seeds/run-seeds.ts',
  },
  schema: 'database-manager/schema.prisma',
});
