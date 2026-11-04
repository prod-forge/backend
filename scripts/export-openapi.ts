import { NestFactory } from '@nestjs/core';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { format, resolveConfig } from 'prettier';

import { AppModule } from '../src/app.module';
import { createOpenApiDocument } from '../src/app.openapi';
import { appSetup } from '../src/app.setup';

const OUTPUT_PATH = join(process.cwd(), 'docs', 'openapi.json');

// The document is built from decorators only, so these placeholders never reach a real service.
// Redis clients try to connect when constructed, so expect ECONNREFUSED log lines when Redis is not running;
// they are harmless because the process exits right after the document is built.
// Every config value without a default is listed, so the export works without any .env file (CI has only .env.common).
process.env.JWT_SECRET ??= 'openapi-export-placeholder-secret-00';
process.env.DATABASE_NAME ??= 'openapi-export';
process.env.DATABASE_PASSWORD ??= 'openapi-export-placeholder';
process.env.DATABASE_PORT ??= '5432';
process.env.DATABASE_USER ??= 'openapi-export';
process.env.SENTRY_DSN ??= '';

async function generate(): Promise<string> {
  // No app.init(): Prisma connects in onModuleInit, so the script stays independent of Postgres
  const app = await NestFactory.create(AppModule, { abortOnError: false, logger: false });

  appSetup(app);
  const document = createOpenApiDocument(app);
  const options = await resolveConfig(OUTPUT_PATH);

  return format(JSON.stringify(document), { ...options, filepath: OUTPUT_PATH });
}

async function main(): Promise<void> {
  const generated = await generate();

  if (process.argv.includes('--check')) {
    const committed = await readFile(OUTPUT_PATH, 'utf8').catch(() => '');
    if (committed !== generated) {
      throw new Error('docs/openapi.json is out of date, run npm run openapi:export and commit the result');
    }
    // eslint-disable-next-line no-console
    console.log('docs/openapi.json is up to date');

    return;
  }

  await writeFile(OUTPUT_PATH, generated);
  // eslint-disable-next-line no-console
  console.log('docs/openapi.json written');
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
