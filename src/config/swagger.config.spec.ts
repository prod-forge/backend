import { swaggerConfig } from './swagger.config';

describe('swaggerConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SWAGGER_ENABLED;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('negative cases', () => {
    it.each(['maybe', '1', 'FALSE'])('throws when SWAGGER_ENABLED is not a strict boolean string (%s)', (value) => {
      process.env.SWAGGER_ENABLED = value;

      expect(() => swaggerConfig()).toThrow(/^- SWAGGER_ENABLED: /m);
    });
  });

  describe('positive cases', () => {
    it('is enabled with the docs endpoint by default', () => {
      expect(swaggerConfig()).toEqual({ swaggerEnabled: true, swaggerEndpoint: 'docs' });
    });

    it('maps SWAGGER_ENABLED=false to false', () => {
      process.env.SWAGGER_ENABLED = 'false';

      expect(swaggerConfig()).toMatchObject({ swaggerEnabled: false });
    });

    it('maps SWAGGER_ENABLED=true to true', () => {
      process.env.SWAGGER_ENABLED = 'true';

      expect(swaggerConfig()).toMatchObject({ swaggerEnabled: true });
    });
  });
});
