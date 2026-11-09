import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { join } from 'node:path';

import { assertDatabaseHost, getDatabaseUrl } from './generate-url';
import { PrismaClient } from './generated/client';

config({
  override: false,
  path: [join(process.cwd(), '.env'), join(process.cwd(), '.env.common')],
});

assertDatabaseHost();

export const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: getDatabaseUrl(),
  }),
});
