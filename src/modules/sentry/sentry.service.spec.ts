import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { LoggerService } from '../../logger/logger.service';
import { SentryService } from './sentry.service';

describe('SentryService', () => {
  let service: SentryService;
  let configService: jest.Mocked<ConfigService>;
  let logger: { log: jest.Mock; warn: jest.Mock };

  const mockSentryEnabled = (enabled: boolean): void => {
    configService.getOrThrow.mockReturnValue({
      sentryDsn: 'https://test@sentry.io/123',
      sentryEnabled: enabled,
      sentryIgnoredErrors: [],
    });
  };

  beforeEach(async () => {
    configService = { getOrThrow: jest.fn() } as unknown as jest.Mocked<ConfigService>;
    logger = { log: jest.fn(), warn: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        SentryService,
        { provide: ConfigService, useValue: configService },
        { provide: LoggerService, useValue: logger },
      ],
    }).compile();

    service = module.get(SentryService);
  });

  describe('negative cases', () => {
    it('logs warning when sentry is disabled', () => {
      mockSentryEnabled(false);

      service.onModuleInit();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ msg: expect.stringContaining('disabled') as string }),
      );
      expect(logger.log).not.toHaveBeenCalled();
    });
  });

  describe('positive cases', () => {
    it('logs success message when sentry is enabled', () => {
      mockSentryEnabled(true);

      service.onModuleInit();

      expect(logger.log).toHaveBeenCalledWith(
        expect.objectContaining({ msg: expect.stringContaining('Sentry') as string }),
      );
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });
});
