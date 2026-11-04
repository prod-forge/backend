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
    it('does not collect PII (user, cookies, headers, bodies, query params, query values)', () => {
      expect(buildSentryOptions(env, '1.0.0', false).dataCollection).toEqual({
        cookies: false,
        databaseQueryData: false,
        genAI: { inputs: false, outputs: false },
        httpBodies: [],
        httpHeaders: false,
        urlQueryParams: false,
        userInfo: false,
      });
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
