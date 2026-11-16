import { assertDatabaseHost, getDatabaseUrl } from '../../database-manager/generate-url';

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

    it.each(['todo/list', 'todo?archive', 'todo#1', 'todo@db', 'todo&admin'])(
      'rejects the URL-reserved character in DATABASE_NAME %s',
      (name) => {
        process.env.DATABASE_NAME = name;

        expect(() => getDatabaseUrl()).toThrow('DATABASE_NAME must not contain URL-reserved characters');
      },
    );
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

    it('encodes special characters in the user name', () => {
      process.env.DATABASE_USER = 'app@internal:ro';

      expect(getDatabaseUrl()).toBe('postgresql://app%40internal%3Aro:p%40ss%2Fword@db.example.internal:5432/todolist');
    });

    it('percent-encodes a database name with a character that is not URL-reserved', () => {
      process.env.DATABASE_NAME = 'todo list.db';

      expect(getDatabaseUrl()).toBe('postgresql://app:p%40ss%2Fword@db.example.internal:5432/todo%20list.db');
    });
  });
});

describe('assertDatabaseHost', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, DATABASE_HOST: 'db.example.internal' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('negative cases', () => {
    it('throws when DATABASE_HOST is missing', () => {
      delete process.env.DATABASE_HOST;

      expect(() => assertDatabaseHost()).toThrow('DATABASE_HOST is not set');
    });

    it('throws when DATABASE_HOST is blank', () => {
      process.env.DATABASE_HOST = '  ';

      expect(() => assertDatabaseHost()).toThrow('DATABASE_HOST is not set');
    });
  });

  describe('positive cases', () => {
    it('passes when DATABASE_HOST is set', () => {
      expect(() => assertDatabaseHost()).not.toThrow();
    });
  });
});
