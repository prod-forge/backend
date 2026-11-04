import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { config } from 'dotenv';
import { join } from 'node:path';

import packageJson from '../package.json';

// Must run before any other import: Sentry/OpenTelemetry patch `http` and `pg` at require time.
// Same precedence as ConfigModule: .env wins over .env.common (dotenv never overrides existing values).
config({ path: [join(process.cwd(), '.env'), join(process.cwd(), '.env.common')], quiet: true });

const dsn = process.env.SENTRY_DSN;

if (dsn && process.env.SENTRY_ENABLED !== 'false') {
  const ignoredErrors = JSON.parse(process.env.SENTRY_IGNORED_ERRORS || '[]') as string[];

  Sentry.init({
    beforeSend(event, hint) {
      const error = hint.originalException as null | Partial<Error> | undefined;

      if (ignoredErrors.some((e) => error?.name?.includes(e))) return null;

      // ValidationError must be skipped from Sentry
      if (error?.name === 'ValidationError') return null;

      return event;
    },
    dsn,
    environment: process.env.NODE_ENV,
    integrations: [nodeProfilingIntegration()],
    release: process.env.APP_VERSION || packageJson.version,
    sendDefaultPii: true,
    tracesSampleRate: 0.2,
  });
}
