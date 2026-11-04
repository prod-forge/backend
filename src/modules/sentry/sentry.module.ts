import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SentryService } from './sentry.service';

@Module({
  exports: [SentryService],
  imports: [ConfigModule],
  providers: [SentryService],
})
export class SentryModule {}
