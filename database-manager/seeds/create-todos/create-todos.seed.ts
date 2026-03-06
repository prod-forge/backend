import { prisma } from '../../prisma';
import { usersSeed } from '../create-users/create-users.seed';

const todosSeed: {
  completed: boolean;
  description?: string;
  title: string;
}[] = [
  {
    completed: false,
    description: 'Milk, bread, eggs, vegetables',
    title: 'Buy groceries',
  },
  {
    completed: true,
    description: 'Prepare initial data for the Todo model',
    title: 'Finish Prisma seed',
  },
  {
    completed: true,
    description: 'Investigate no-unsafe-assignment errors',
    title: 'Fix ESLint warnings',
  },
  {
    completed: false,
    description: '30 minutes of stretching and cardio',
    title: 'Morning workout',
  },
  {
    completed: false,
    description: 'Learn more about adapters and pooling',
    title: 'Read Prisma documentation',
  },
  {
    completed: false,
    description: 'Organize priorities for the upcoming week',
    title: 'Plan weekly tasks',
  },
  {
    completed: true,
    description: 'Declutter desk and organize cables',
    title: 'Clean workspace',
  },
  {
    completed: false,
    description: 'Upgrade npm packages to latest versions',
    title: 'Update dependencies',
  },
  {
    completed: false,
    description: 'Cover Todo service with basic tests',
    title: 'Write unit tests',
  },
  {
    completed: true,
    description: 'Check code quality and leave comments',
    title: 'Review pull requests',
  },
  {
    completed: true,
    description: 'Summarize agenda and discussion points',
    title: 'Prepare meeting notes',
  },
  {
    completed: false,
    description: 'Improve readability and reduce complexity',
    title: 'Refactor Todo logic',
  },
  {
    completed: true,
    description: 'Create a manual backup before migration',
    title: 'Backup database',
  },
  {
    completed: false,
    description: 'Define REST routes for Todo operations',
    title: 'Design API endpoints',
  },
  {
    completed: true,
    description: 'Resolve CI errors in the main branch',
    title: 'Fix failing build',
  },
  {
    completed: false,
    description: 'Reduce response time for Todo list',
    title: 'Optimize queries',
  },
  {
    completed: true,
    description: 'Generate sample records for presentation',
    title: 'Prepare demo data',
  },
  {
    completed: false,
    description: 'Look for warnings and unexpected errors',
    title: 'Review application logs',
  },
  {
    completed: true,
    description: 'Configure DATABASE_URL and secrets',
    title: 'Set up environment variables',
  },
  {
    completed: false,
    description: 'Describe setup and development workflow',
    title: 'Write documentation',
  },
  {
    completed: false,
    description: 'Verify behavior in edge runtime',
    title: 'Test edge deployment',
  },
  {
    completed: true,
    description: 'Align on tasks and deadlines',
    title: 'Schedule team meeting',
  },
  {
    completed: false,
    description: 'Add proper error messages and logging',
    title: 'Improve error handling',
  },
  {
    completed: true,
    description: 'Apply latest schema changes',
    title: 'Run database migration',
  },
  {
    completed: false,
    description: 'Stabilize tests that fail intermittently',
    title: 'Fix flaky tests',
  },
  {
    completed: false,
    description: 'Check CPU and memory usage',
    title: 'Analyze performance metrics',
  },
  {
    completed: true,
    description: 'Summarize changes for the next release',
    title: 'Prepare release notes',
  },
  {
    completed: false,
    description: 'Ensure access rules are correct',
    title: 'Review security settings',
  },
  {
    completed: true,
    description: 'Add new setup instructions',
    title: 'Update README',
  },
  {
    completed: false,
    description: 'Sort and prioritize incoming issues',
    title: 'Triage bug reports',
  },
  {
    completed: false,
    description: 'Add loading and empty states',
    title: 'Improve UI feedback',
  },
  {
    completed: true,
    description: 'Remove obsolete comments from code',
    title: 'Clean up TODOs',
  },
  {
    completed: true,
    description: 'Ensure seed runs without errors',
    title: 'Test database seeding',
  },
  {
    completed: false,
    description: 'Watch for errors after deployment',
    title: 'Monitor production logs',
  },
  {
    completed: false,
    description: 'Define goals for the next iteration',
    title: 'Plan next sprint',
  },
];

export async function createTodos(): Promise<void> {
  try {
    const userIds = usersSeed.map((u) => u.id);

    // Distribute todos in a round-robin fashion across the 5 users
    const todosData = todosSeed.map((t, idx) => ({
      completed: t.completed,
      description: t.description,
      title: t.title,
      userId: userIds[idx % userIds.length],
    }));
    // Use createMany for performance (createdAt defaults applied by Prisma/DB)
    await prisma.todo.createMany({
      data: todosData,
    });

    // eslint-disable-next-line no-console
    console.log(`Seeded ${todosData.length} todos across ${userIds.length} users.`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Seeding error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
