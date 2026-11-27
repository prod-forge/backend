import { metricsConfig } from './metrics.config';

describe('metricsConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.HEALTH_CHECK_TRIGGER_MS;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('negative cases', () => {
    it.each(['1.5', '0', '-1', ''])('throws when HEALTH_CHECK_TRIGGER_MS is not a positive integer (%s)', (value) => {
      process.env.HEALTH_CHECK_TRIGGER_MS = value;

      expect(() => metricsConfig()).toThrow(/^- HEALTH_CHECK_TRIGGER_MS: /m);
    });
  });

  describe('positive cases', () => {
    it('defaults the health check trigger to 15000ms', () => {
      expect(metricsConfig()).toEqual({ healthCheckTriggerMs: 15000 });
    });

    it('maps HEALTH_CHECK_TRIGGER_MS to a number', () => {
      process.env.HEALTH_CHECK_TRIGGER_MS = '30000';

      expect(metricsConfig()).toEqual({ healthCheckTriggerMs: 30000 });
    });
  });
});
