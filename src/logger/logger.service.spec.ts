type LogDescriptor = Record<string, unknown>;
type MessageFormat = (log: LogDescriptor, messageKey: string) => string;

let capturedMessageFormat: MessageFormat | undefined;

const messageFormat = (): MessageFormat => {
  if (!capturedMessageFormat) {
    throw new Error('pino-pretty messageFormat was not captured');
  }

  return capturedMessageFormat;
};

jest.mock('pino-pretty', () =>
  jest.fn().mockImplementation((config: { messageFormat?: MessageFormat }) => {
    capturedMessageFormat = config.messageFormat;

    return { write: jest.fn() };
  }),
);

import { Test } from '@nestjs/testing';

import { EnvironmentType } from '../config/enums/environment.enum';
import { environmentConfig } from '../config/environment.config';
import { logConfig } from '../config/log.config';
import { EnvironmentService } from '../modules/environment/environment.service';
import { LoggerService } from './logger.service';

const makeModule = async (logPretty = false): Promise<LoggerService> => {
  const module = await Test.createTestingModule({
    providers: [
      LoggerService,
      EnvironmentService,
      { provide: environmentConfig.KEY, useValue: { env: EnvironmentType.test } },
      {
        provide: logConfig.KEY,
        useValue: { logExcludeEndpoints: [], logLevel: 'silent', logPretty },
      },
    ],
  }).compile();

  return module.get(LoggerService);
};

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(async () => {
    service = await makeModule();
  });

  describe('positive cases', () => {
    it('creates service with logPretty enabled', async () => {
      await expect(makeModule(true)).resolves.toBeDefined();
    });

    it('log does not throw', () => {
      expect(() => service.log({ ctx: 'test', msg: 'hello' })).not.toThrow();
    });

    it('error does not throw', () => {
      expect(() => service.error({ ctx: 'test', msg: 'error occurred' })).not.toThrow();
    });

    it('warn does not throw', () => {
      expect(() => service.warn({ ctx: 'test', msg: 'warning' })).not.toThrow();
    });

    it('debug does not throw', () => {
      expect(() => service.debug({ ctx: 'test', msg: 'debug info' })).not.toThrow();
    });

    it('setAppName does not throw', () => {
      expect(() => service.setAppName('MyApp')).not.toThrow();
    });

    it('log accepts optional fields without throwing', () => {
      expect(() =>
        service.log({
          code: 'ERR_CODE',
          ctx: 'test',
          details: { key: 'val' },
          method: 'GET',
          msg: 'test',
          path: '/api',
        }),
      ).not.toThrow();
    });

    it('error accepts stack without throwing', () => {
      expect(() => service.error({ ctx: 'test', msg: 'err', stack: 'Error: msg\n  at ...' })).not.toThrow();
    });

    it('log accepts a string message', () => {
      expect(() => service.log('string message' as never)).not.toThrow();
    });

    it('error accepts a string message', () => {
      expect(() => service.error('error string' as never)).not.toThrow();
    });

    it('warn accepts a string message', () => {
      expect(() => service.warn('warn string' as never)).not.toThrow();
    });

    it('debug accepts a string message', () => {
      expect(() => service.debug('debug string' as never)).not.toThrow();
    });
  });

  describe('messageFormat', () => {
    beforeEach(async () => {
      await makeModule(true);
    });

    it('includes ctx in brackets when ctx is provided', () => {
      const result = messageFormat()({ ctx: 'TestCtx', levelLabel: 'info', msg: 'hello', traceId: 'abc' }, 'msg');
      expect(result).toContain('[TestCtx]');
    });

    it('omits brackets when ctx is falsy', () => {
      const result = messageFormat()({ levelLabel: 'info', msg: 'hello', traceId: 'abc' }, 'msg');
      expect(result).not.toContain('[');
    });

    it('uses levelLabel when provided', () => {
      const result = messageFormat()({ levelLabel: 'info', msg: 'hello', traceId: '' }, 'msg');
      expect(result).toContain('info');
    });

    it('falls back to level number when levelLabel is absent', () => {
      const result = messageFormat()({ level: 30, msg: 'hello', traceId: '' }, 'msg');
      expect(result).toContain('30');
    });

    it('includes Trace-ID prefix for non-empty traceId', () => {
      const result = messageFormat()({ levelLabel: 'info', msg: 'hello', traceId: 'trace-abc' }, 'msg');
      expect(result).toContain('Trace-ID: trace-abc');
    });

    it('omits Trace-ID prefix when traceId is empty string', () => {
      const result = messageFormat()({ levelLabel: 'info', msg: 'hello', traceId: '' }, 'msg');
      expect(result).not.toContain('Trace-ID:');
    });
  });
});
