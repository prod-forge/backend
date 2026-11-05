import type { HealthIndicatorService } from '@nestjs/terminus';

import type { ShutdownService } from './shutdown.service';

import { ShutdownHealthService } from './shutdown-health.service';

const makeIndicatorService = (): jest.Mocked<HealthIndicatorService> => {
  const indicator = {
    down: jest.fn().mockImplementation((data: Record<string, unknown>) => ({ shutdown: { ...data, status: 'down' } })),
    up: jest.fn().mockReturnValue({ shutdown: { status: 'up' } }),
  };

  return {
    check: jest.fn().mockReturnValue(indicator),
  } as unknown as jest.Mocked<HealthIndicatorService>;
};

describe('ShutdownHealthService', () => {
  let service: ShutdownHealthService;
  let shutdownService: jest.Mocked<ShutdownService>;
  let healthIndicatorService: jest.Mocked<HealthIndicatorService>;

  beforeEach(() => {
    shutdownService = { isShuttingDown: jest.fn() } as unknown as jest.Mocked<ShutdownService>;
    healthIndicatorService = makeIndicatorService();

    service = new ShutdownHealthService(shutdownService, healthIndicatorService);
  });

  describe('negative cases', () => {
    it('returns down result when shutting down', () => {
      shutdownService.isShuttingDown.mockReturnValue(true);

      const result = service.check('shutdown');

      expect(result).toBeDefined();
      const indicator = healthIndicatorService.check.mock.results[0].value as { down: jest.Mock; up: jest.Mock };
      expect(indicator.down).toHaveBeenCalledWith({ message: 'Shutting down' });
      expect(indicator.up).not.toHaveBeenCalled();
    });
  });

  describe('positive cases', () => {
    it('returns up result when not shutting down', () => {
      shutdownService.isShuttingDown.mockReturnValue(false);

      const result = service.check('shutdown');

      expect(result).toBeDefined();
      const indicator = healthIndicatorService.check.mock.results[0].value as { down: jest.Mock; up: jest.Mock };
      expect(indicator.up).toHaveBeenCalled();
      expect(indicator.down).not.toHaveBeenCalled();
    });
  });
});
