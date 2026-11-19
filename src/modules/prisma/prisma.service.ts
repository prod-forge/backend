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
      connectionTimeoutMillis: config.databaseConnectTimeoutMs,
      idleTimeoutMillis: 30000,
      max: config.databasePoolMax,
      // eslint-disable-next-line camelcase -- pg option name
      statement_timeout: config.databaseStatementTimeoutMs,
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

    // The class extends PrismaClient without log generics, so $on is typed with never; narrow it to log events
    const client = this as unknown as PrismaClient<'error' | 'info' | 'query' | 'warn'>;

    client.$on('query', (e) => {
      prismaQueryDuration.observe(e.duration / 1000);
      prismaQueriesTotal.inc();
      RequestContext.incrementQueryCount();
    });

    // Forward each configured log level to the logger; query metrics above stay unconditional
    if (config.databaseLogLevels.includes('error')) {
      client.$on('error', (e) => {
        this.logger.error({ ctx: PrismaService.name, details: { target: e.target }, msg: e.message });
      });
    }

    if (config.databaseLogLevels.includes('warn')) {
      client.$on('warn', (e) => {
        this.logger.warn({ ctx: PrismaService.name, details: { target: e.target }, msg: e.message });
      });
    }

    if (config.databaseLogLevels.includes('info')) {
      client.$on('info', (e) => {
        this.logger.log({ ctx: PrismaService.name, details: { target: e.target }, msg: e.message });
      });
    }

    if (config.databaseLogLevels.includes('query')) {
      client.$on('query', (e) => {
        this.logger.debug({
          ctx: PrismaService.name,
          details: { durationMs: e.duration, target: e.target },
          msg: e.query,
        });
      });
    }
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
