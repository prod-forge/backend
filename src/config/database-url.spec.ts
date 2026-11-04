import { getDatabaseUrl } from '../../database-manager/generate-url';

describe('getDatabaseUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_HOST: 'db.example.internal',
      DATABASE_NAME: 'todolist',
      DATABASE_PASSWORD: 'p@ss/word',
      DATABASE_PORT: '5432',
      DATABASE_USER: 'app',
    };
    delete process.env.DATABASE_SSL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('negative cases', () => {
    it('adds no sslmode when DATABASE_SSL is not exactly "true"', () => {
      process.env.DATABASE_SSL = 'yes';

      expect(getDatabaseUrl()).toBe('postgresql://app:p%40ss%2Fword@db.example.internal:5432/todolist');
    });
  });

  describe('positive cases', () => {
    it('uses sslmode=verify-full by default, so pg verifies the certificate and host name', () => {
      process.env.DATABASE_SSL = 'true';

      expect(getDatabaseUrl()).toBe(
        'postgresql://app:p%40ss%2Fword@db.example.internal:5432/todolist?sslmode=verify-full',
      );
    });

    it('uses the requested sslmode for the Prisma schema engine', () => {
      process.env.DATABASE_SSL = 'true';

      expect(getDatabaseUrl('require')).toBe(
        'postgresql://app:p%40ss%2Fword@db.example.internal:5432/todolist?sslmode=require',
      );
    });
  });
});
