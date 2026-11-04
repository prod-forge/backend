import { Injectable } from '@nestjs/common';

import { MobileLogDto } from '../../api/client-logs/dtos/mobile-log.dto';
import { WebLogDto } from '../../api/client-logs/dtos/web-log.dto';
import { LoggerService } from '../../logger/logger.service';

const CLIENT_LOGS_CTX = 'client-logs';

@Injectable()
export class ClientLogsService {
  constructor(private readonly loggerService: LoggerService) {}

  processMobileLog(dto: MobileLogDto): void {
    this.loggerService.warn({
      ctx: CLIENT_LOGS_CTX,
      details: { payload: dto.payload, platform: dto.platform, source: 'mobile', timestamp: dto.timestamp },
      msg: 'Mobile client log',
    });
  }

  processWebLog(dto: WebLogDto): void {
    this.loggerService.warn({
      ctx: CLIENT_LOGS_CTX,
      details: {
        actions: dto.actions,
        clientTraceId: dto.traceId,
        env: dto.env,
        metadata: dto.metadata,
        source: 'web',
        timestamp: dto.timestamp,
      },
      msg: 'Web client log',
    });
  }
}
