import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LoggerModule } from '../../logger/logger.module';
import { EnvironmentModule } from '../environment/environment.module';
import { SentryService } from './sentry.service';

@Global()
@Module({
  exports: [SentryService],
  imports: [ConfigModule, EnvironmentModule, LoggerModule],
  providers: [SentryService],
})
export class SentryModule {}
