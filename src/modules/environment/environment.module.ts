import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { environmentConfig } from '../../config/environment.config';
import { EnvironmentService } from './environment.service';

@Module({
  controllers: [],
  exports: [EnvironmentService],
  imports: [ConfigModule.forFeature(environmentConfig)],
  providers: [EnvironmentService],
})
export class EnvironmentModule {}
