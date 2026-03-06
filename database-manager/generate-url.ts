export const getDatabaseUrl = (): string => {
  const password = process.env.DATABASE_PASSWORD || '';
  const ssl = process.env.DATABASE_SSL === 'true' ? '?sslmode=require' : '';
  const encodedPassword = encodeURIComponent(password);

  return `postgresql://${process.env.DATABASE_USER}:${encodedPassword}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}${ssl}`;
};
