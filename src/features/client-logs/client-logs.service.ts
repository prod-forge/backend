import { Injectable } from '@nestjs/common';

import { MobileLogDto } from '../../api/client-logs/dtos/mobile-log.dto';
import { WebLogDto } from '../../api/client-logs/dtos/web-log.dto';
import { LoggerService } from '../../logger/logger.service';

const CLIENT_LOGS_CTX = 'client-logs';

// Query strings and hashes can carry tokens or personal data, so only origin and path are logged
const stripQueryAndHash = (value: string | undefined): string | undefined => value?.split(/[?#]/)[0];

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
    // Validation requires metadata; the cast keeps this tolerant of a missing one instead of failing a public endpoint
    const metadata = dto.metadata as Partial<WebLogDto['metadata']> | undefined;

    this.loggerService.warn({
      ctx: CLIENT_LOGS_CTX,
      details: {
        actions: dto.actions,
        clientTraceId: dto.traceId,
        env: dto.env,
        metadata: Object.assign({}, metadata, {
          fullUrl: stripQueryAndHash(metadata?.fullUrl),
          url: stripQueryAndHash(metadata?.url),
        }),
        source: 'web',
        timestamp: dto.timestamp,
      },
      msg: 'Web client log',
    });
  }
}
