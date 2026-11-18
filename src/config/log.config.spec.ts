import { logConfig } from './log.config';

describe('logConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('negative cases', () => {
    it.each(['TRUE', '0', '1', '', 'maybe'])('throws when LOG_PRETTY is %j', (value) => {
      process.env.LOG_PRETTY = value;

      expect(() => logConfig()).toThrow(/^- LOG_PRETTY: /m);
    });

    it('names LOG_EXCLUDE_ENDPOINTS when it is not a JSON array', () => {
      process.env.LOG_EXCLUDE_ENDPOINTS = '/health';

      expect(() => logConfig()).toThrow(/^- LOG_EXCLUDE_ENDPOINTS: /m);
    });
  });

  describe('positive cases', () => {
    it('defaults LOG_PRETTY to true', () => {
      delete process.env.LOG_PRETTY;

      expect(logConfig()).toMatchObject({ logPretty: true });
    });

    it('maps LOG_PRETTY=false to false', () => {
      process.env.LOG_PRETTY = 'false';

      expect(logConfig()).toMatchObject({ logPretty: false });
    });

    it('parses LOG_EXCLUDE_ENDPOINTS from a JSON array', () => {
      process.env.LOG_EXCLUDE_ENDPOINTS = '["/health","/metrics"]';

      expect(logConfig()).toMatchObject({ logExcludeEndpoints: ['/health', '/metrics'] });
    });

    it('defaults LOG_EXCLUDE_ENDPOINTS to an empty array', () => {
      delete process.env.LOG_EXCLUDE_ENDPOINTS;

      expect(logConfig()).toMatchObject({ logExcludeEndpoints: [] });
    });
  });
});
