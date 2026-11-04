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

  describe('negative cases', () => {
    it('does not throw when metadata is missing', () => {
      expect(() =>
        service.processWebLog({
          actions: [],
          env: 'test',
          timestamp: '2026-05-18T00:00:00.000Z',
          traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
        } as never),
      ).not.toThrow();
      expect(logger.warn).toHaveBeenCalledTimes(1);
    });

    it('strips query string and hash from fullUrl and url before logging', () => {
      service.processWebLog({
        actions: [{ ctx: 'app', level: WebLogLevel.INFO, message: 'm', payload: {} }],
        env: 'test',
        metadata: { fullUrl: 'http://localhost/reset?token=abc#frag', url: '/reset?token=abc' } as never,
        timestamp: '2026-05-18T00:00:00.000Z',
        traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
      });

      const [entry] = logger.warn.mock.calls[0] as [{ details: { metadata: Record<string, string> } }];

      expect(entry.details.metadata).toEqual({ fullUrl: 'http://localhost/reset', url: '/reset' });
    });
  });

  describe('positive cases', () => {
    it('processWebLog logs at warn with the client-logs ctx', () => {
      service.processWebLog({
        actions: [{ ctx: 'app', level: WebLogLevel.ERROR, message: 'boom', payload: {} }],
        env: 'test',
        metadata: { fullUrl: 'http://localhost/', url: '/' } as never,
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
            metadata: { fullUrl: 'http://localhost/', url: '/' },
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
