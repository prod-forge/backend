import * as Sentry from '@sentry/node';
import { config } from 'dotenv';
import { join } from 'node:path';

import packageJson from '../package.json';
import { isSentryEnabled } from './modules/sentry/sentry-enabled';
import { buildSentryOptions } from './modules/sentry/sentry-options';
import { isTracingEnabled, startTracing } from './tracing';

// Must run before any other import: Sentry/OpenTelemetry patch `http` and `pg` at require time.
// Same precedence as ConfigModule: .env wins over .env.common (dotenv never overrides existing values).
config({ path: [join(process.cwd(), '.env'), join(process.cwd(), '.env.common')], quiet: true });

const sentryDsn = isSentryEnabled(process.env) ? process.env.SENTRY_DSN : undefined;

// OpenTelemetry owns tracing when an OTLP endpoint is set: start it first, Sentry then attaches errors to its spans
startTracing(sentryDsn);

if (sentryDsn) {
  Sentry.init(buildSentryOptions(process.env, process.env.APP_VERSION || packageJson.version, isTracingEnabled()));
}
