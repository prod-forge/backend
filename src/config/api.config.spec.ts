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

    it('names API_ALLOWED_ORIGINS when it is not a JSON array', () => {
      process.env.API_ALLOWED_ORIGINS = 'https://a.com';

      expect(() => apiConfig()).toThrow(/^- API_ALLOWED_ORIGINS: /m);
    });

    it.each(['{}', '"https://a.com"'])(
      'names API_ALLOWED_ORIGINS when it is valid JSON but not an array (%s)',
      (value) => {
        process.env.API_ALLOWED_ORIGINS = value;

        expect(() => apiConfig()).toThrow(/^- API_ALLOWED_ORIGINS: /m);
      },
    );

    it('does not throw a SyntaxError when API_ALLOWED_ORIGINS is malformed JSON', () => {
      process.env.API_ALLOWED_ORIGINS = '["https://a.com"';

      expect(() => apiConfig()).not.toThrow(SyntaxError);
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

    it('parses API_ALLOWED_ORIGINS from a JSON array', () => {
      process.env.API_ALLOWED_ORIGINS = '["https://a.com","https://b.com"]';

      expect(apiConfig()).toMatchObject({ apiAllowedOrigins: ['https://a.com', 'https://b.com'] });
    });
  });
});
