import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

let capturedBeforeSend: ((event: unknown, hint: { originalException: unknown }) => unknown) | undefined;

jest.mock('@sentry/node', () => ({
  default: { init: jest.fn() },
  init: jest.fn().mockImplementation((opts: { beforeSend?: (event: unknown, hint: unknown) => unknown }) => {
    capturedBeforeSend = opts.beforeSend;
  }),
}));

jest.mock('@sentry/profiling-node', () => ({
  nodeProfilingIntegration: jest.fn().mockReturnValue({}),
}));

import { LoggerService } from '../../logger/logger.service';
import { EnvironmentService } from '../environment/environment.service';
import { SentryService } from './sentry.service';

describe('SentryService', () => {
  let service: SentryService;
  let configService: jest.Mocked<ConfigService>;
  let logger: { log: jest.Mock; warn: jest.Mock };

  const makeSentryConfig = (
    enabled: boolean,
  ): { sentryDsn: string; sentryEnabled: boolean; sentryIgnoredErrors: string[] } => ({
    sentryDsn: 'https://test@sentry.io/123',
    sentryEnabled: enabled,
    sentryIgnoredErrors: [],
  });

  beforeEach(async () => {
    configService = {
      getOrThrow: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    logger = { log: jest.fn(), warn: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        SentryService,
        { provide: ConfigService, useValue: configService },
        { provide: LoggerService, useValue: logger },
        { provide: EnvironmentService, useValue: { getEnv: jest.fn().mockReturnValue('test') } },
      ],
    }).compile();

    service = module.get(SentryService);
    jest.clearAllMocks();
  });

  describe('negative cases', () => {
    it('logs warning when sentry is disabled', () => {
      configService.getOrThrow.mockImplementation((key: string) => {
        if (key === 'sentryConfig') return makeSentryConfig(false);
        if (key === 'appConfig') return { appVersion: '1.0.0' };

        return;
      });

      service.onModuleInit();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ msg: expect.stringContaining('disabled') as string }),
      );
    });
  });

  describe('positive cases', () => {
    it('logs success message when sentry is enabled', () => {
      configService.getOrThrow.mockImplementation((key: string) => {
        if (key === 'sentryConfig') return makeSentryConfig(true);
        if (key === 'appConfig') return { appVersion: '1.0.0' };

        return;
      });

      service.onModuleInit();

      expect(logger.log).toHaveBeenCalledWith(
        expect.objectContaining({ msg: expect.stringContaining('Sentry') as string }),
      );
    });

    it('does not throw when sentry init is called', () => {
      configService.getOrThrow.mockImplementation((key: string) => {
        if (key === 'sentryConfig') return makeSentryConfig(true);
        if (key === 'appConfig') return { appVersion: '2.0.0' };

        return;
      });

      expect(() => service.onModuleInit()).not.toThrow();
    });

    it('beforeSend returns null for ignored error names', () => {
      configService.getOrThrow.mockImplementation((key: string) => {
        if (key === 'sentryConfig') return { ...makeSentryConfig(true), sentryIgnoredErrors: ['IgnoredError'] };
        if (key === 'appConfig') return { appVersion: '1.0.0' };

        return;
      });

      service.onModuleInit();

      const result = capturedBeforeSend?.(
        {},
        { originalException: Object.assign(new Error(), { name: 'IgnoredError' }) },
      );

      expect(result).toBeNull();
    });

    it('beforeSend returns null for ValidationError', () => {
      configService.getOrThrow.mockImplementation((key: string) => {
        if (key === 'sentryConfig') return makeSentryConfig(true);
        if (key === 'appConfig') return { appVersion: '1.0.0' };

        return;
      });

      service.onModuleInit();

      const result = capturedBeforeSend?.(
        {},
        { originalException: Object.assign(new Error(), { name: 'ValidationError' }) },
      );

      expect(result).toBeNull();
    });

    it('beforeSend passes through other errors', () => {
      configService.getOrThrow.mockImplementation((key: string) => {
        if (key === 'sentryConfig') return makeSentryConfig(true);
        if (key === 'appConfig') return { appVersion: '1.0.0' };

        return;
      });

      service.onModuleInit();

      const event = { level: 'error' };
      const result = capturedBeforeSend?.(event, { originalException: new Error('regular error') });

      expect(result).toBe(event);
    });
  });
});
