import { apiConfig } from './api.config';

describe('apiConfig', () => {
  const originalEnv = process.env;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env = { ...originalEnv };
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleSpy.mockRestore();
  });

  describe('negative cases', () => {
    it('throws when TRUST_PROXY is not a number', () => {
      process.env.TRUST_PROXY = 'abc';

      expect(() => apiConfig()).toThrow('Please provide the valid ENVs mentioned above');
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
