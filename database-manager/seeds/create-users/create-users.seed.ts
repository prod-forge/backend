import { prisma } from '../../prisma';

export const usersSeed = [
  {
    email: 'user1@example.com',
    id: 'f870a1dd-3814-42e9-8175-99cd507873ab',
    name: 'User One',
  },
  {
    email: 'user2@example.com',
    id: '535645c4-0409-4ac3-b78c-1f7b9581873b',
    name: 'User Two',
  },
  {
    email: 'user3@example.com',
    id: 'a0890f22-58c8-46e4-b3d4-3a4249ddb124',
    name: 'User Three',
  },
  {
    email: 'user4@example.com',
    id: 'eebecb59-f301-4869-87ed-6af566412666',
    name: 'User Four',
  },
  {
    email: 'user5@example.com',
    id: 'd1a647fb-fd6b-4076-b629-b0dfd0aa213f',
    name: 'User Five',
  },
];

export async function creteUsers(): Promise<void> {
  try {
    // Upsert users so the seed is idempotent
    const upsertedUsers = await Promise.all(
      usersSeed.map((u) =>
        prisma.user.upsert({
          create: { email: u.email, id: u.id, name: u.name },
          update: { name: u.name },
          where: { email: u.email },
        }),
      ),
    );

    // eslint-disable-next-line no-console
    console.log(`Seeded ${upsertedUsers.length} users.`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Seeding error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
