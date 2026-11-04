import { authConfig } from './auth.config';

describe('authConfig', () => {
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
    it('throws when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;

      expect(() => authConfig()).toThrow('Please provide the valid ENVs mentioned above');
    });

    it('throws when JWT_SECRET is shorter than 32 characters', () => {
      process.env.JWT_SECRET = 'short';

      expect(() => authConfig()).toThrow('Please provide the valid ENVs mentioned above');
    });
  });

  describe('positive cases', () => {
    it('maps valid env values to the config object', () => {
      process.env.JWT_SECRET = 's'.repeat(32);
      process.env.JWT_TTL = '120';

      expect(authConfig()).toEqual({ jwtSecret: 's'.repeat(32), jwtTtl: 120 });
    });

    it('defaults JWT_TTL to 3600', () => {
      process.env.JWT_SECRET = 's'.repeat(32);
      delete process.env.JWT_TTL;

      expect(authConfig()).toEqual({ jwtSecret: 's'.repeat(32), jwtTtl: 3600 });
    });
  });
});
