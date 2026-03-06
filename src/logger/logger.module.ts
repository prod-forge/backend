import { Module } from '@nestjs/common';

import { EnvironmentModule } from '../modules/environment/environment.module';
import { LoggerService } from './logger.service';

@Module({
  exports: [LoggerService],
  imports: [EnvironmentModule],
  providers: [LoggerService],
})
export class LoggerModule {}
