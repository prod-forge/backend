jest.mock('@sentry/node', () => ({
  httpIntegration: jest.fn((options: object) => ({ name: 'Http', options })),
}));

jest.mock('@sentry/profiling-node', () => ({
  nodeProfilingIntegration: jest.fn(() => ({ name: 'ProfilingIntegration' })),
}));

import { buildSentryOptions } from './sentry-options';

const env = {
  NODE_ENV: 'production',
  SENTRY_DSN: 'https://key@sentry.example/1',
  SENTRY_IGNORED_ERRORS: '["Ignored"]',
};

describe('buildSentryOptions', () => {
  describe('negative cases', () => {
    it('does not send default PII (IP address, cookies, user)', () => {
      expect(buildSentryOptions(env, '1.0.0', false).sendDefaultPii).toBe(false);
    });

    it('never attaches incoming request bodies', () => {
      const integrations = buildSentryOptions(env, '1.0.0', false).integrations as { name: string; options?: object }[];

      expect(integrations).toContainEqual({ name: 'Http', options: { maxIncomingRequestBodySize: 'none' } });
    });

    it('drops ignored and validation errors', () => {
      const { beforeSend } = buildSentryOptions(env, '1.0.0', false);
      const send = (name: string): unknown =>
        beforeSend?.({ type: undefined }, { originalException: Object.assign(new Error('x'), { name }) });

      expect(send('IgnoredError')).toBeNull();
      expect(send('ValidationError')).toBeNull();
    });
  });

  describe('positive cases', () => {
    it('maps the environment, release and OpenTelemetry ownership', () => {
      expect(buildSentryOptions(env, '1.2.3', true)).toMatchObject({
        dsn: env.SENTRY_DSN,
        environment: 'production',
        release: '1.2.3',
        skipOpenTelemetrySetup: true,
      });
    });

    it('keeps other errors', () => {
      const event = { type: undefined };

      expect(buildSentryOptions(env, '1.0.0', false).beforeSend?.(event, { originalException: new Error('x') })).toBe(
        event,
      );
    });
  });
});
