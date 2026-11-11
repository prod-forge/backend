import { throttlerConfig } from './throttler.config';

describe('throttlerConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.THROTTLE_LIMIT;
    delete process.env.THROTTLE_TTL;
    delete process.env.THROTTLE_ENABLED;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('negative cases', () => {
    it('throws when THROTTLE_LIMIT is not a number', () => {
      process.env.THROTTLE_LIMIT = 'many';

      expect(() => throttlerConfig()).toThrow(/^- THROTTLE_LIMIT: /m);
    });
  });

  describe('positive cases', () => {
    it('uses 60 requests per 60 seconds, enabled, by default', () => {
      expect(throttlerConfig()).toEqual({ throttlerEnabled: true, throttlerLimit: 60, throttlerTtl: 60000 });
    });

    it('disables throttling when THROTTLE_ENABLED is false', () => {
      process.env.THROTTLE_ENABLED = 'false';

      expect(throttlerConfig()).toMatchObject({ throttlerEnabled: false });
    });
  });
});
