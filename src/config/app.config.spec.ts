import { appConfig } from './app.config';

describe('appConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.APP_PORT;
    delete process.env.SHUTDOWN_DRAIN_MS;
    delete process.env.SHUTDOWN_INFLIGHT_TIMEOUT_MS;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('negative cases', () => {
    it.each(['1.5', '0', '-1', '65536', ''])(
      'throws when APP_PORT is not a positive integer below 65536 (%s)',
      (value) => {
        process.env.APP_PORT = value;

        expect(() => appConfig()).toThrow(/^- APP_PORT: /m);
      },
    );

    it.each(['1.5', '-1', ''])('throws when SHUTDOWN_DRAIN_MS is not a non-negative integer (%s)', (value) => {
      process.env.SHUTDOWN_DRAIN_MS = value;

      expect(() => appConfig()).toThrow(/^- SHUTDOWN_DRAIN_MS: /m);
    });

    it.each(['1.5', '-1', ''])(
      'throws when SHUTDOWN_INFLIGHT_TIMEOUT_MS is not a non-negative integer (%s)',
      (value) => {
        process.env.SHUTDOWN_INFLIGHT_TIMEOUT_MS = value;

        expect(() => appConfig()).toThrow(/^- SHUTDOWN_INFLIGHT_TIMEOUT_MS: /m);
      },
    );
  });

  describe('positive cases', () => {
    it('uses the port and shutdown defaults', () => {
      expect(appConfig()).toMatchObject({
        appPort: 3000,
        shutdownDrainMs: 10000,
        shutdownInflightTimeoutMs: 20000,
      });
    });

    it('maps the port and shutdown values to numbers', () => {
      process.env.APP_PORT = '8080';
      process.env.SHUTDOWN_DRAIN_MS = '5000';
      process.env.SHUTDOWN_INFLIGHT_TIMEOUT_MS = '1000';

      expect(appConfig()).toMatchObject({
        appPort: 8080,
        shutdownDrainMs: 5000,
        shutdownInflightTimeoutMs: 1000,
      });
    });

    it('accepts 0 for the shutdown delays', () => {
      process.env.SHUTDOWN_DRAIN_MS = '0';
      process.env.SHUTDOWN_INFLIGHT_TIMEOUT_MS = '0';

      expect(appConfig()).toMatchObject({ shutdownDrainMs: 0, shutdownInflightTimeoutMs: 0 });
    });

    it('accepts the highest port number', () => {
      process.env.APP_PORT = '65535';

      expect(appConfig()).toMatchObject({ appPort: 65535 });
    });
  });
});
