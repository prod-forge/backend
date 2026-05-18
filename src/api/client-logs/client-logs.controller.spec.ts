import { Test } from '@nestjs/testing';

import { ClientLogsService } from '../../features/client-logs/client-logs.service';
import { ClientLogsController } from './client-logs.controller';
import { WebLogLevel } from './dtos/web-log-action.dto';

const webLogDto = {
  actions: [{ ctx: 'app', level: WebLogLevel.INFO, message: 'test', payload: {} }],
  env: 'test',
  metadata: {
    browser: 'Chrome',
    browserVersion: '148.0.0.0',
    devicePixelRatio: 2,
    fullUrl: 'http://localhost:5173/',
    language: 'en-US',
    mobile: false,
    os: 'macOS',
    screen: '1728x1117',
    timezone: 'UTC',
    url: '/',
    viewport: '1046x920',
  },
  timestamp: '2026-05-18T00:00:00.000Z',
  traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
};

const mobileLogDto = {
  payload: { data: 'test' },
  platform: 'ios',
  timestamp: '2026-05-18T00:00:00.000Z',
  traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
};

describe('ClientLogsController', () => {
  let controller: ClientLogsController;
  let service: { processMobileLog: jest.Mock; processWebLog: jest.Mock };

  beforeEach(async () => {
    service = {
      processMobileLog: jest.fn(),
      processWebLog: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [ClientLogsController],
      providers: [{ provide: ClientLogsService, useValue: service }],
    }).compile();

    controller = module.get(ClientLogsController);

    jest.clearAllMocks();
  });

  describe('postWebLogs', () => {
    describe('negative cases', () => {
      it('propagates service error', () => {
        service.processWebLog.mockImplementation(() => {
          throw new Error('s3 error');
        });

        expect(() => controller.postWebLogs(webLogDto)).toThrow('s3 error');
      });
    });

    describe('positive cases', () => {
      it('checks all levels are existed in WebLogLevel', () => {
        expect(WebLogLevel.LOG).toBe('log');
        expect(WebLogLevel.INFO).toBe('info');
        expect(WebLogLevel.WARN).toBe('warn');
        expect(WebLogLevel.DEBUG).toBe('debug');
        expect(WebLogLevel.ERROR).toBe('error');
        expect(WebLogLevel.CRITICAL).toBe('critical');
      });

      it('delegates to service and returns void', () => {
        const result = controller.postWebLogs(webLogDto);

        expect(service.processWebLog).toHaveBeenCalledWith(webLogDto);
        expect(result).toBeUndefined();
      });
    });
  });

  describe('postMobileLogs', () => {
    describe('negative cases', () => {
      it('propagates service error', () => {
        service.processMobileLog.mockImplementation(() => {
          throw new Error('s3 error');
        });

        expect(() => controller.postMobileLogs(mobileLogDto)).toThrow('s3 error');
      });
    });

    describe('positive cases', () => {
      it('delegates to service and returns void', () => {
        const result = controller.postMobileLogs(mobileLogDto);

        expect(service.processMobileLog).toHaveBeenCalledWith(mobileLogDto);
        expect(result).toBeUndefined();
      });
    });
  });
});
