import { swaggerConfig } from './swagger.config';

describe('swaggerConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SWAGGER_ENABLED;
    delete process.env.SWAGGER_ENDPOINT;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('negative cases', () => {
    it.each(['1', '0', 'TRUE', 'FALSE', 'yes'])(
      'throws when SWAGGER_ENABLED is %j instead of true or false',
      (value) => {
        process.env.SWAGGER_ENABLED = value;

        expect(() => swaggerConfig()).toThrow(/^- SWAGGER_ENABLED: /m);
      },
    );
  });

  describe('positive cases', () => {
    it('enables Swagger at /docs by default', () => {
      expect(swaggerConfig()).toEqual({ swaggerEnabled: true, swaggerEndpoint: 'docs' });
    });

    it.each([
      ['true', true],
      ['false', false],
    ])('maps SWAGGER_ENABLED=%s to %s', (value, expected) => {
      process.env.SWAGGER_ENABLED = value;

      expect(swaggerConfig()).toMatchObject({ swaggerEnabled: expected });
    });
  });
});
