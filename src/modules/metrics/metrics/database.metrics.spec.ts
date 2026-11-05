import { Test } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { DatabaseMetrics } from './database.metrics';

describe('DatabaseMetrics', () => {
  let service: DatabaseMetrics;
  let prisma: { $queryRawUnsafe: jest.Mock };

  beforeEach(async () => {
    prisma = { $queryRawUnsafe: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [DatabaseMetrics, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(DatabaseMetrics);
  });

  describe('negative cases', () => {
    it('passes a query error through, for example when pg_stat_statements is missing', async () => {
      const error = new Error('relation "pg_stat_statements" does not exist');
      prisma.$queryRawUnsafe.mockRejectedValue(error);

      await expect(service.getTopSlowQueries()).rejects.toBe(error);
    });

    it('returns empty array when no slow queries', async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([]);

      const result = await service.getTopSlowQueries(10);

      expect(result).toHaveLength(0);
    });
  });

  describe('positive cases', () => {
    it('returns mapped metrics with numeric values', async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([
        {
          calls: BigInt(10),
          ['max_ms']: 200.5,
          ['mean_ms']: 100.5,
          query: 'SELECT * FROM users',
          queryid: '123456',
          ['total_ms']: 1005.0,
        },
      ]);

      const result = await service.getTopSlowQueries(10);

      expect(result).toHaveLength(1);
      expect(result[0].calls).toBe(10);
      expect(result[0].meanMs).toBe(100.5);
      expect(result[0].maxMs).toBe(200.5);
      expect(result[0].totalMs).toBe(1005.0);
      expect(result[0].query).toBe('SELECT * FROM users');
      expect(result[0].queryId).toBe('123456');
    });

    it('calls prisma with correct SQL, queryid and limit', async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([]);

      await service.getTopSlowQueries(5);

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('pg_stat_statements'));
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('queryid'));
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('LIMIT 5'));
    });

    it('uses default limit of 10', async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([]);

      await service.getTopSlowQueries();

      expect(prisma.$queryRawUnsafe).toHaveBeenCalled();
    });

    it('converts BigInt calls to number', async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([
        { calls: BigInt(9007199254740991), ['max_ms']: 1, ['mean_ms']: 1, query: 'Q', ['total_ms']: 1 },
      ]);

      const result = await service.getTopSlowQueries();

      expect(typeof result[0].calls).toBe('number');
    });
  });
});
