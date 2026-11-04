import type { ErrorEvent, NodeOptions } from '@sentry/node';

import { httpIntegration } from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

type SentryOptionsEnv = {
  readonly NODE_ENV?: string;
  readonly SENTRY_DSN?: string;
  readonly SENTRY_IGNORED_ERRORS?: string;
};

export const buildSentryOptions = (
  env: SentryOptionsEnv,
  release: string,
  skipOpenTelemetrySetup: boolean,
): NodeOptions => {
  const ignoredErrors = JSON.parse(env.SENTRY_IGNORED_ERRORS || '[]') as string[];

  return {
    beforeSend(event, hint): ErrorEvent | null {
      const error = hint.originalException as null | Partial<Error> | undefined;

      if (ignoredErrors.some((e) => error?.name?.includes(e))) return null;

      // ValidationError must be skipped from Sentry
      if (error?.name === 'ValidationError') return null;

      return event;
    },
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    // GDPR: request bodies can hold personal data (the login body carries the email), so they are never attached
    integrations: [httpIntegration({ maxIncomingRequestBodySize: 'none' }), nodeProfilingIntegration()],
    propagateTraceparent: true,
    release,
    // No IP addresses, cookies or user details by default; the exception filter sets only the internal user id
    sendDefaultPii: false,
    // With an OTLP endpoint the NodeSDK in tracing.ts owns the single TracerProvider.
    skipOpenTelemetrySetup,
    tracesSampleRate: 0.2,
  };
};
