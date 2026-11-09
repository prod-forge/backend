import { databaseConfig } from './database.config';

describe('databaseConfig', () => {
  const originalEnv = process.env;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_HOST: 'localhost',
      DATABASE_NAME: 'db',
      DATABASE_PASSWORD: 'pass',
      DATABASE_PORT: '5432',
      DATABASE_USER: 'user',
    };
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleSpy.mockRestore();
  });

  describe('negative cases', () => {
    it('throws when DATABASE_HOST is missing', () => {
      delete process.env.DATABASE_HOST;

      expect(() => databaseConfig()).toThrow('Please provide the valid ENVs mentioned above');
    });

    it('throws when DATABASE_HOST is empty', () => {
      process.env.DATABASE_HOST = '';

      expect(() => databaseConfig()).toThrow('Please provide the valid ENVs mentioned above');
    });

    it('throws when DATABASE_POOL_MAX is not a number', () => {
      process.env.DATABASE_POOL_MAX = 'abc';

      expect(() => databaseConfig()).toThrow('Please provide the valid ENVs mentioned above');
    });

    it('throws when DATABASE_STATEMENT_TIMEOUT_MS is not a number', () => {
      process.env.DATABASE_STATEMENT_TIMEOUT_MS = 'abc';

      expect(() => databaseConfig()).toThrow('Please provide the valid ENVs mentioned above');
    });
  });

  describe('positive cases', () => {
    it.each(['localhost', 'database', 'db.example.internal', '10.0.0.5'])('accepts DATABASE_HOST %s', (host) => {
      process.env.DATABASE_HOST = host;

      expect(() => databaseConfig()).not.toThrow();
    });

    it('applies the pool and timeout defaults', () => {
      expect(databaseConfig()).toMatchObject({
        databaseConnectTimeoutMs: 5000,
        databasePoolMax: 10,
        databaseStatementTimeoutMs: 5000,
      });
    });

    it('maps the pool and timeout variables to numbers', () => {
      process.env.DATABASE_POOL_MAX = '20';
      process.env.DATABASE_CONNECT_TIMEOUT_MS = '1000';
      process.env.DATABASE_STATEMENT_TIMEOUT_MS = '2000';

      expect(databaseConfig()).toMatchObject({
        databaseConnectTimeoutMs: 1000,
        databasePoolMax: 20,
        databaseStatementTimeoutMs: 2000,
      });
    });
  });
});
