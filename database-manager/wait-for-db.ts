import { prisma } from './prisma';

async function wait(): Promise<void> {
  let retries = 20;

  while (retries) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      // eslint-disable-next-line no-console
      console.log('Database is ready');

      return;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Waiting for database...');
      retries -= 1;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  throw new Error('Database not reachable');
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
wait()
  .catch(() => {
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
