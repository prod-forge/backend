import type { LoggerService } from '../../logger/logger.service';

import { WebLogLevel } from '../../api/client-logs/dtos/web-log-action.dto';
import { ClientLogsService } from './client-logs.service';

describe('ClientLogsService', () => {
  let service: ClientLogsService;
  let logger: { warn: jest.Mock };

  beforeEach(() => {
    logger = { warn: jest.fn() };
    service = new ClientLogsService(logger as unknown as LoggerService);
  });

  describe('positive cases', () => {
    it('processWebLog logs at warn with the client-logs ctx', () => {
      service.processWebLog({
        actions: [{ ctx: 'app', level: WebLogLevel.ERROR, message: 'boom', payload: {} }],
        env: 'test',
        metadata: {} as never,
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
      });

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn.mock.calls[0]).toEqual([
        {
          ctx: 'client-logs',
          details: {
            actions: [{ ctx: 'app', level: WebLogLevel.ERROR, message: 'boom', payload: {} }],
            clientTraceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
            env: 'test',
            metadata: {},
            source: 'web',
            timestamp: '2026-05-18T00:00:00.000Z',
          },
          msg: 'Web client log',
        },
      ]);
    });

    it('processMobileLog logs at warn with the client-logs ctx', () => {
      service.processMobileLog({
        payload: { data: 'test' },
        platform: 'ios',
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
      });

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn.mock.calls[0]).toEqual([
        {
          ctx: 'client-logs',
          details: {
            payload: { data: 'test' },
            platform: 'ios',
            source: 'mobile',
            timestamp: '2026-05-18T00:00:00.000Z',
          },
          msg: 'Mobile client log',
        },
      ]);
    });
  });
});
