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
    it.each(['TRUE', '0', '1', '', 'maybe'])('throws when SWAGGER_ENABLED is %j', (value) => {
      process.env.SWAGGER_ENABLED = value;

      expect(() => swaggerConfig()).toThrow(/^- SWAGGER_ENABLED: /m);
    });
  });

  describe('positive cases', () => {
    it('defaults SWAGGER_ENABLED to true', () => {
      expect(swaggerConfig()).toMatchObject({ swaggerEnabled: true });
    });

    it('maps SWAGGER_ENABLED=false to false', () => {
      process.env.SWAGGER_ENABLED = 'false';

      expect(swaggerConfig()).toMatchObject({ swaggerEnabled: false });
    });
  });
});
