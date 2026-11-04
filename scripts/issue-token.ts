import type { DynamicModule } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { join } from 'node:path';

import { authConfig } from '../src/config/auth.config';
import { AuthModule } from '../src/modules/auth/auth.module';
import { AuthService } from '../src/modules/auth/auth.service';

const issueTokenModule: DynamicModule = {
  imports: [
    ConfigModule.forRoot({
      envFilePath: [join(process.cwd(), '.env'), join(process.cwd(), '.env.common')],
      isGlobal: true,
      load: [authConfig],
    }),
  ],
  module: AuthModule,
};

async function main(): Promise<void> {
  const userId = process.argv[2];
  if (!userId) {
    throw new Error('Usage: npm run token:issue -- <userId>');
  }

  const app = await NestFactory.createApplicationContext(issueTokenModule, { logger: false });
  const token = await app.get(AuthService).issueToken(userId);
  // eslint-disable-next-line no-console
  console.log(token);
  await app.close();
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
