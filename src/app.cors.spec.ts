import type { ConfigType } from '@nestjs/config';

import type { apiConfig } from './config/api.config';

import { buildCorsOptions } from './app.cors';

const makeConfig = (overrides: Partial<ConfigType<typeof apiConfig>> = {}): ConfigType<typeof apiConfig> =>
  ({
    apiAllowedOrigins: ['https://app.example.com'],
    apiAllowNonBrowserOrigins: false,
    ...overrides,
  }) as ConfigType<typeof apiConfig>;

const resolveOrigin = (config: ConfigType<typeof apiConfig>, origin: string): boolean => {
  const { origin: check } = buildCorsOptions(config) as {
    origin: (o: string | undefined, cb: (a: null, b: boolean) => void) => void;
  };
  let allowed = false;

  check(origin, (_error, isAllowed) => {
    allowed = isAllowed;
  });

  return allowed;
};

describe('buildCorsOptions', () => {
  describe('negative cases', () => {
    it('rejects an origin that is not allowed', () => {
      expect(resolveOrigin(makeConfig(), 'https://evil.example.com')).toBe(false);
    });

    it('rejects a request without an origin when non-browser origins are disallowed', () => {
      expect(resolveOrigin(makeConfig(), '')).toBe(false);
    });
  });

  describe('positive cases', () => {
    it('exposes the trace id header to the web client', () => {
      expect(buildCorsOptions(makeConfig()).exposedHeaders).toEqual(['X-Trace-Id']);
    });

    it('allows a listed origin', () => {
      expect(resolveOrigin(makeConfig(), 'https://app.example.com')).toBe(true);
    });

    it('allows a request without an origin when non-browser origins are allowed', () => {
      expect(resolveOrigin(makeConfig({ apiAllowNonBrowserOrigins: true }), '')).toBe(true);
    });
  });
});
