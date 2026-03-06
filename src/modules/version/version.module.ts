import { Module } from '@nestjs/common';

import { VersionController } from '../../api/version/version.controller';
import { VersionService } from './version.service';

@Module({
  controllers: [VersionController],
  imports: [],
  providers: [VersionService],
})
export class VersionModule {}
