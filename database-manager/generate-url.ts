// pg (app, seeds) verifies with verify-full; the Prisma schema engine (migrate deploy) is given `require`.
type DatabaseSslMode = 'require' | 'verify-full';

// The app validates DATABASE_HOST in databaseConfig; scripts outside Nest call this before building the URL.
export const assertDatabaseHost = (): void => {
  if (!process.env.DATABASE_HOST?.trim()) {
    throw new Error('DATABASE_HOST is not set');
  }
};

export const getDatabaseUrl = (sslMode: DatabaseSslMode = 'verify-full'): string => {
  const password = process.env.DATABASE_PASSWORD || '';
  const ssl = process.env.DATABASE_SSL === 'true' ? `?sslmode=${sslMode}` : '';
  const encodedUser = encodeURIComponent(process.env.DATABASE_USER || '');
  const encodedPassword = encodeURIComponent(password);
  const encodedName = encodeURIComponent(process.env.DATABASE_NAME || '');

  return `postgresql://${encodedUser}:${encodedPassword}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${encodedName}${ssl}`;
};
