type SentryEnv = {
  readonly SENTRY_DSN?: string;
  readonly SENTRY_ENABLED?: string;
};

// Single predicate for instrument.ts (runs before ConfigModule) and sentryConfig, so both always agree
export const isSentryEnabled = (env: SentryEnv): boolean => Boolean(env.SENTRY_DSN) && env.SENTRY_ENABLED === 'true';
