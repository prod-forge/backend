import { isSentryEnabled } from '../modules/sentry/sentry-enabled';
import { sentryConfig } from './sentry.config';

describe('sentryConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SENTRY_DSN;
    delete process.env.SENTRY_ENABLED;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('negative cases', () => {
    it.each([
      ['DSN set, flag missing', 'https://key@sentry.example/1', undefined],
      ['DSN set, flag false', 'https://key@sentry.example/1', 'false'],
      ['DSN empty, flag true', '', 'true'],
    ])('is disabled when %s, the same as instrument.ts decides', (_case, dsn, enabled) => {
      process.env.SENTRY_DSN = dsn;
      if (enabled !== undefined) process.env.SENTRY_ENABLED = enabled;

      expect(sentryConfig()).toMatchObject({ sentryEnabled: false });
      expect(isSentryEnabled(process.env)).toBe(false);
    });

    it.each(['TRUE', 'yes', '1', ''])(
      'throws when SENTRY_ENABLED is %j, and instrument.ts keeps Sentry off',
      (value) => {
        process.env.SENTRY_DSN = 'https://key@sentry.example/1';
        process.env.SENTRY_ENABLED = value;

        expect(() => sentryConfig()).toThrow(/^- SENTRY_ENABLED: /m);
        expect(isSentryEnabled(process.env)).toBe(false);
      },
    );

    it('names SENTRY_IGNORED_ERRORS when it is not a JSON array', () => {
      process.env.SENTRY_IGNORED_ERRORS = 'TimeoutError';

      expect(() => sentryConfig()).toThrow(/^- SENTRY_IGNORED_ERRORS: /m);
    });
  });

  describe('positive cases', () => {
    it('loads without SENTRY_DSN and keeps Sentry disabled, so a deployment without Sentry needs no DSN', () => {
      process.env.SENTRY_ENABLED = 'false';

      expect(sentryConfig()).toMatchObject({ sentryDsn: '', sentryEnabled: false });
    });

    it('is enabled only when the DSN is set and SENTRY_ENABLED is "true", the same as instrument.ts decides', () => {
      process.env.SENTRY_DSN = 'https://key@sentry.example/1';
      process.env.SENTRY_ENABLED = 'true';

      expect(sentryConfig()).toMatchObject({ sentryEnabled: true });
      expect(isSentryEnabled(process.env)).toBe(true);
    });

    it('parses SENTRY_IGNORED_ERRORS from a JSON array', () => {
      process.env.SENTRY_IGNORED_ERRORS = '["TimeoutError"]';

      expect(sentryConfig()).toMatchObject({ sentryIgnoredErrors: ['TimeoutError'] });
    });
  });
});
