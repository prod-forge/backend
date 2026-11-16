// pg (app, seeds) verifies with verify-full; the Prisma schema engine (migrate deploy) is given `require`.
type DatabaseSslMode = 'require' | 'verify-full';

// `pg-connection-string` decodes the database path with `decodeURI`, which leaves
// these reserved characters percent-encoded. A name containing one would reach
// PostgreSQL encoded, so the app, the seeds and the Prisma schema engine reject it
// here instead of silently resolving to a different database.
const RESERVED_DATABASE_NAME_CHARS = /[;/?:@&=+$,#]/;

// The app validates DATABASE_HOST in databaseConfig; scripts outside Nest call this before building the URL.
export const assertDatabaseHost = (): void => {
  if (!process.env.DATABASE_HOST?.trim()) {
    throw new Error('DATABASE_HOST is not set');
  }
};

export const getDatabaseUrl = (sslMode: DatabaseSslMode = 'verify-full'): string => {
  const name = process.env.DATABASE_NAME || '';

  if (RESERVED_DATABASE_NAME_CHARS.test(name)) {
    throw new Error(`DATABASE_NAME must not contain URL-reserved characters (; / ? : @ & = + $ , #): ${name}`);
  }

  const password = process.env.DATABASE_PASSWORD || '';
  const ssl = process.env.DATABASE_SSL === 'true' ? `?sslmode=${sslMode}` : '';
  const encodedUser = encodeURIComponent(process.env.DATABASE_USER || '');
  const encodedPassword = encodeURIComponent(password);
  const encodedName = encodeURIComponent(name);

  return `postgresql://${encodedUser}:${encodedPassword}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${encodedName}${ssl}`;
};
