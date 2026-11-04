import type { ConfigType } from '@nestjs/config';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../database-manager/generated/client';
import { databaseConfig } from '../../config/database.config';
import { RequestContext } from '../../logger/context/request-context';
import { LoggerService } from '../../logger/logger.service';
import { prismaQueriesTotal, prismaQueryDuration } from './prisma.metrics';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(
    @Inject(databaseConfig.KEY)
    private readonly config: ConfigType<typeof databaseConfig>,

    private readonly logger: LoggerService,
  ) {
    const adapter = new PrismaPg({
      connectionString: config.databaseUrl,
      idleTimeoutMillis: 600000,
    });

    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        ...config.databaseLogLevels
          .filter((level) => level !== 'query')
          .map((level) => ({ emit: 'event' as const, level })),
      ],
    });

    // The class extends PrismaClient without log generics, so $on is typed with never; narrow it to query events
    (this as unknown as PrismaClient<'query'>).$on('query', (e) => {
      prismaQueryDuration.observe(e.duration / 1000);
      prismaQueriesTotal.inc();
      RequestContext.incrementQueryCount();
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      await this.$queryRaw`SELECT 1`;
    } catch (err) {
      this.logger.error({
        ctx: PrismaService.name,
        details: err,
        msg: 'Prisma failed',
      });
      // DB is required dependency in the app, need to kill app if DB is not available
      if (this.config.databaseFailFast) {
        process.exit(1);
      }
    }
  }
}
