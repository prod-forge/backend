import { Module } from '@nestjs/common';

import { ClientLogsController } from '../../api/client-logs/client-logs.controller';
import { ClientLogsService } from './client-logs.service';

@Module({
  controllers: [ClientLogsController],
  providers: [ClientLogsService],
})
export class ClientLogsModule {}
