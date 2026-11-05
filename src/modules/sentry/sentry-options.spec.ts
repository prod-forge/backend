jest.mock('@sentry/node', () => ({
  httpIntegration: jest.fn((options: object) => ({ name: 'Http', options })),
  openTelemetryIntegration: jest.fn(() => ({ name: 'OpenTelemetry' })),
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

      expect(integrations).toContainEqual({ name: 'Http', options: { maxRequestBodySize: 'none' } });
    });

    it('drops ignored and validation errors', () => {
      const { beforeSend } = buildSentryOptions(env, '1.0.0', false);
      const send = (name: string): unknown =>
        beforeSend?.({ type: undefined }, { originalException: Object.assign(new Error('x'), { name }) });

      expect(send('IgnoredError')).toBeNull();
      expect(send('ValidationError')).toBeNull();
    });

    it('strips the query string and the fragment from the request url', () => {
      // Sentry's event field is snake_case
      const request = Object.fromEntries([
        ['query_string', 'search=private'],
        ['url', 'https://api.example/api/v1/todos?search=private#top'],
      ]) as { url: string };
      const event = { request, type: undefined };

      const result = buildSentryOptions(env, '1.0.0', false).beforeSend?.(event, { originalException: new Error('x') });

      expect(result).toEqual({ request: { url: 'https://api.example/api/v1/todos' }, type: undefined });
    });
  });

  describe('positive cases', () => {
    it('maps the environment and release', () => {
      expect(buildSentryOptions(env, '1.2.3', false)).toMatchObject({
        dsn: env.SENTRY_DSN,
        environment: 'production',
        release: '1.2.3',
      });
    });

    it('traces on its own when OpenTelemetry does not own tracing', () => {
      const options = buildSentryOptions(env, '1.0.0', false);

      expect(options.tracesSampleRate).toBe(0.2);
      expect(options.enableOpenTelemetrySetup).toBe(true);
      expect(options.integrations).not.toContainEqual({ name: 'OpenTelemetry' });
    });

    it('records no spans and links errors to OpenTelemetry spans when OpenTelemetry owns tracing', () => {
      const options = buildSentryOptions(env, '1.0.0', true);

      expect(options.tracesSampleRate).toBeUndefined();
      expect(options.enableOpenTelemetrySetup).toBe(false);
      expect(options.integrations).toContainEqual({ name: 'OpenTelemetry' });
    });

    it('keeps a request url without a query string as it is', () => {
      const event = { request: { url: 'https://api.example/api/v1/todos' }, type: undefined };

      const result = buildSentryOptions(env, '1.0.0', false).beforeSend?.(event, { originalException: new Error('x') });

      expect(result).toEqual({ request: { url: 'https://api.example/api/v1/todos' }, type: undefined });
    });

    it('keeps other errors', () => {
      const event = { type: undefined };

      expect(buildSentryOptions(env, '1.0.0', false).beforeSend?.(event, { originalException: new Error('x') })).toBe(
        event,
      );
    });
  });
});
