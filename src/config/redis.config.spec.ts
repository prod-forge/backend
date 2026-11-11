import { redisConfig } from './redis.config';

describe('redisConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.REDIS_TLS;
    delete process.env.REDIS_PASSWORD;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('negative cases', () => {
    it('throws when REDIS_TLS is not a strict boolean string', () => {
      process.env.REDIS_TLS = 'maybe';

      expect(() => redisConfig()).toThrow(/^- REDIS_TLS: /m);
    });
  });

  describe('positive cases', () => {
    it('defaults to no TLS and no password', () => {
      expect(redisConfig()).toMatchObject({ redisPassword: undefined, redisTls: false });
    });

    it('maps REDIS_TLS=true and REDIS_PASSWORD', () => {
      process.env.REDIS_TLS = 'true';
      process.env.REDIS_PASSWORD = 'secret';

      expect(redisConfig()).toMatchObject({ redisPassword: 'secret', redisTls: true });
    });

    it('maps REDIS_TLS=false to false', () => {
      process.env.REDIS_TLS = 'false';

      expect(redisConfig()).toMatchObject({ redisTls: false });
    });
  });
});
