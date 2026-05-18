import { ClientLogsService } from './client-logs.service';

describe('ClientLogsService', () => {
  let service: ClientLogsService;

  beforeEach(() => {
    service = new ClientLogsService();
  });

  describe('positive cases', () => {
    it('processWebLog does not throw', () => {
      expect(() =>
        service.processWebLog({
          actions: [{ ctx: 'app', level: 'debug' as never, message: 'test', payload: {} }],
          env: 'test',
          metadata: {} as never,
          timestamp: '2026-05-18T00:00:00.000Z',
          traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
        }),
      ).not.toThrow();
    });

    it('processMobileLog does not throw', () => {
      expect(() =>
        service.processMobileLog({
          payload: { data: 'test' },
          platform: 'ios',
          timestamp: '2026-05-18T00:00:00.000Z',
          traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
        }),
      ).not.toThrow();
    });
  });
});
