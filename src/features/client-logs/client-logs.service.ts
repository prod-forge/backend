import { Injectable } from '@nestjs/common';

import { MobileLogDto } from '../../api/client-logs/dtos/mobile-log.dto';
import { WebLogDto } from '../../api/client-logs/dtos/web-log.dto';

@Injectable()
export class ClientLogsService {
  // eslint-disable-next-line no-warning-comments
  // TODO: upload to S3
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  processMobileLog(_dto: MobileLogDto): void {
    /* empty */
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  processWebLog(_dto: WebLogDto): void {
    /* empty */
  }
}
