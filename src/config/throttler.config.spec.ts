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
    it.each(['1', '0', 'TRUE', 'FALSE', 'yes'])(
      'throws when THROTTLE_ENABLED is %j instead of true or false',
      (value) => {
        process.env.THROTTLE_ENABLED = value;

        expect(() => throttlerConfig()).toThrow(/^- THROTTLE_ENABLED: /m);
      },
    );

    it('throws when THROTTLE_LIMIT is not a number', () => {
      process.env.THROTTLE_LIMIT = 'many';

      expect(() => throttlerConfig()).toThrow(/^- THROTTLE_LIMIT: /m);
    });

    it.each(['1.5', '0', '-1', ''])('throws when THROTTLE_LIMIT is not a positive integer (%s)', (value) => {
      process.env.THROTTLE_LIMIT = value;

      expect(() => throttlerConfig()).toThrow(/^- THROTTLE_LIMIT: /m);
    });

    it.each(['1.5', '0', '-1', ''])('throws when THROTTLE_TTL is not a positive integer (%s)', (value) => {
      process.env.THROTTLE_TTL = value;

      expect(() => throttlerConfig()).toThrow(/^- THROTTLE_TTL: /m);
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
