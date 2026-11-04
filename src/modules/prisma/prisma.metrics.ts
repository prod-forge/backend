import { Counter, Histogram } from 'prom-client';

export const prismaQueryDuration = new Histogram({
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  help: 'Prisma query duration in seconds',
  name: 'prisma_query_duration_seconds',
});

export const prismaQueriesTotal = new Counter({
  help: 'Total Prisma queries',
  name: 'prisma_queries_total',
});
