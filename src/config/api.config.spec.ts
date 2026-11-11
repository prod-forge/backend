import { apiConfig } from './api.config';

describe('apiConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('negative cases', () => {
    it('throws when TRUST_PROXY is not a number', () => {
      process.env.TRUST_PROXY = 'abc';

      expect(() => apiConfig()).toThrow(/^- TRUST_PROXY: /m);
    });
  });

  describe('positive cases', () => {
    it('maps TRUST_PROXY to a number', () => {
      process.env.TRUST_PROXY = '1';

      expect(apiConfig()).toMatchObject({ trustProxy: 1 });
    });

    it('defaults TRUST_PROXY to 0', () => {
      delete process.env.TRUST_PROXY;

      expect(apiConfig()).toMatchObject({ trustProxy: 0 });
    });
  });
});
