import { prisma } from '../prisma';
import { createTodos } from './create-todos/create-todos.seed';
import { creteUsers } from './create-users/create-users.seed';

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`Seeding in env: ${process.env.NODE_ENV}...`);

  switch (process.env.NODE_ENV) {
    case 'production':
      break;
    case 'test':
      await creteUsers();
      break;
    default:
      await creteUsers();
      await createTodos();
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
