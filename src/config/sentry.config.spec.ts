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
      ['DSN set, flag not exactly "true"', 'https://key@sentry.example/1', 'yes'],
      ['DSN set, flag false', 'https://key@sentry.example/1', 'false'],
      ['DSN empty, flag true', '', 'true'],
    ])('is disabled when %s, the same as instrument.ts decides', (_case, dsn, enabled) => {
      process.env.SENTRY_DSN = dsn;
      if (enabled !== undefined) process.env.SENTRY_ENABLED = enabled;

      expect(sentryConfig()).toMatchObject({ sentryEnabled: false });
      expect(isSentryEnabled(process.env)).toBe(false);
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
  });
});
