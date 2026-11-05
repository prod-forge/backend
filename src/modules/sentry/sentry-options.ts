import type { ErrorEvent, NodeOptions } from '@sentry/node';

import { httpIntegration, openTelemetryIntegration } from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import { TRACES_SAMPLE_RATE } from './sentry.constants';

type SentryOptionsEnv = {
  readonly NODE_ENV?: string;
  readonly SENTRY_DSN?: string;
  readonly SENTRY_IGNORED_ERRORS?: string;
};

// Removes the query string and the fragment: they can carry user-typed text
const stripQueryAndHash = (url: string): string => url.split(/[?#]/, 1)[0];

/**
 * Without an OTLP endpoint Sentry traces on its own. With one, OpenTelemetry owns tracing (src/tracing.ts) and sends
 * spans to Sentry over OTLP; Sentry then records no spans itself and only links errors to the active OTel span.
 */
export const buildSentryOptions = (env: SentryOptionsEnv, release: string, otelOwnsTracing: boolean): NodeOptions => {
  const ignoredErrors = JSON.parse(env.SENTRY_IGNORED_ERRORS || '[]') as string[];

  return {
    beforeSend(event, hint): ErrorEvent | null {
      const error = hint.originalException as null | Partial<Error> | undefined;

      if (ignoredErrors.some((e) => error?.name?.includes(e))) return null;

      // ValidationError must be skipped from Sentry
      if (error?.name === 'ValidationError') return null;

      // dataCollection already turns query params off; this also covers a URL set by hand
      if (event.request) {
        delete event.request.query_string;

        if (event.request.url) {
          event.request.url = stripQueryAndHash(event.request.url);
        }
      }

      return event;
    },
    // No user details, cookies, headers, bodies, query params or query values; the exception filter sets only the
    // internal user id
    dataCollection: {
      cookies: false,
      databaseQueryData: false,
      genAI: { inputs: false, outputs: false },
      httpBodies: [],
      httpHeaders: false,
      urlQueryParams: false,
      userInfo: false,
    },
    dsn: env.SENTRY_DSN,
    // Without our NodeSDK, Sentry registers its tracer provider as the global OpenTelemetry one, so
    // trace.getActiveSpan() in the trace id middleware sees Sentry's span and X-Trace-Id matches the Sentry trace
    enableOpenTelemetrySetup: !otelOwnsTracing,
    environment: env.NODE_ENV,
    // GDPR: request bodies can hold personal data (the login body carries the email), so they are never attached
    integrations: [
      httpIntegration({ maxRequestBodySize: 'none' }),
      nodeProfilingIntegration(),
      ...(otelOwnsTracing ? [openTelemetryIntegration()] : []),
    ],
    propagateTraceparent: true,
    release,
    ...(!otelOwnsTracing && { tracesSampleRate: TRACES_SAMPLE_RATE }),
  };
};
