import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { DatabaseMetricInterface } from '../interfaces/database-metric.interface';

@Injectable()
export class DatabaseMetrics {
  constructor(private prisma: PrismaService) {}

  async getTopSlowQueries(limit = 10): Promise<DatabaseMetricInterface[]> {
    const rows = await this.prisma.$queryRawUnsafe<
      {
        calls: bigint;
        max_ms: number;
        mean_ms: number;
        query: string;
        total_ms: number;
      }[]
    >(`
      SELECT
        query,
        calls,
        round(mean_exec_time::numeric, 2) as mean_ms,
        round(max_exec_time::numeric, 2) as max_ms,
        round(total_exec_time::numeric, 2) as total_ms
      FROM pg_stat_statements
      WHERE query NOT ILIKE '%pg_%'
      AND query NOT ILIKE 'INSERT INTO "_prisma_migrations"%'
      AND query NOT ILIKE 'UPDATE "_prisma_migrations"%'
      AND query NOT ILIKE 'UPDATE "_prisma_migrations"%'
      AND query NOT ILIKE '%information_schema%'
      AND query NOT ILIKE 'SELECT version()'
      AND query NOT ILIKE 'SELECT $1'
      AND query NOT ILIKE 'CREATE INDEX%'
      AND query NOT ILIKE 'CREATE UNIQUE INDEX%'
      AND query NOT ILIKE 'ALTER TABLE%'
      AND query NOT ILIKE 'CREATE TABLE%'
      AND query NOT ILIKE 'CREATE DATABASE%'
      AND query NOT ILIKE 'DROP DATABASE%'
      ORDER BY mean_exec_time DESC
        LIMIT ${limit}
  `);

    return rows.map<DatabaseMetricInterface>((row) => ({
      ...row,
      calls: Number(row.calls), // BigInt -> number
      maxMs: Number(row.max_ms), // string -> number
      meanMs: Number(row.mean_ms), // string -> number
      totalMs: Number(row.total_ms), // string -> number
    }));
  }
}
