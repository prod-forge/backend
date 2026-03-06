import type { ConfigType } from '@nestjs/config';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../database-manager/generated/client';
import { appConfig } from '../../config/app.config';
import { databaseConfig } from '../../config/database.config';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(
    @Inject(databaseConfig.KEY)
    private config: ConfigType<typeof databaseConfig>,

    @Inject(appConfig.KEY)
    private configApp: ConfigType<typeof appConfig>,

    private logger: LoggerService,
  ) {
    const adapter = new PrismaPg({
      connectionString: config.databaseUrl,
      idleTimeoutMillis: 600000,
    });

    super({
      adapter,
      log: config.databaseLogLevels.map((level) => ({
        emit: 'event',
        level,
      })),
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
