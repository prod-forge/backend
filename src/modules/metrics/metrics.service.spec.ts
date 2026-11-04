import { Test } from '@nestjs/testing';

const mockGaugeSet = jest.fn();
const mockGaugeReset = jest.fn();
const mockSetRefresher = jest.fn();

jest.mock('./metrics/slow-query.metrics', () => ({
  setSlowQueryRefresher: mockSetRefresher,
  slowQueryMeanMs: { reset: mockGaugeReset, set: mockGaugeSet },
}));

import { LoggerService } from '../../logger/logger.service';
import { MetricsService } from './metrics.service';
import { DatabaseMetrics } from './metrics/database.metrics';

describe('MetricsService', () => {
  let service: MetricsService;
  let databaseMetrics: { getTopSlowQueries: jest.Mock };
  let logger: { error: jest.Mock; warn: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    databaseMetrics = {
      getTopSlowQueries: jest.fn().mockResolvedValue([]),
    };
    logger = { error: jest.fn(), warn: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        MetricsService,
        { provide: DatabaseMetrics, useValue: databaseMetrics },
        { provide: LoggerService, useValue: logger },
      ],
    }).compile();

    service = module.get(MetricsService);
    service.onModuleInit();
  });

  describe('negative cases', () => {
    it('warns once and skips when pg_stat_statements is missing', async () => {
      databaseMetrics.getTopSlowQueries.mockRejectedValue(new Error('relation "pg_stat_statements" does not exist'));

      await expect(service.updateDatabaseMetrics()).resolves.toBeUndefined();
      await expect(service.updateDatabaseMetrics()).resolves.toBeUndefined();

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(mockGaugeSet).not.toHaveBeenCalled();
    });

    it('logs unexpected errors without failing the scrape', async () => {
      databaseMetrics.getTopSlowQueries.mockRejectedValue(new Error('connection lost'));

      await expect(service.updateDatabaseMetrics()).resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('positive cases', () => {
    it('getDatabaseMetrics returns the slow queries as JSON-ready objects', async () => {
      const rows = [{ calls: 1, maxMs: 2, meanMs: 1, query: 'SELECT 1', queryId: '11', totalMs: 1 }];
      databaseMetrics.getTopSlowQueries.mockResolvedValue(rows);

      await expect(service.getDatabaseMetrics()).resolves.toEqual(rows);
    });

    it('getDatabaseMetrics returns an empty list when pg_stat_statements is missing', async () => {
      databaseMetrics.getTopSlowQueries.mockRejectedValue(new Error('relation "pg_stat_statements" does not exist'));

      await expect(service.getDatabaseMetrics()).resolves.toEqual([]);
    });

    it('refreshes the gauge on every scrape through the installed refresher', async () => {
      const [[refresher]] = mockSetRefresher.mock.calls as [[() => Promise<void>]];
      await refresher();

      expect(databaseMetrics.getTopSlowQueries).toHaveBeenCalledWith(10);
    });

    it('resets the gauge and sets one series per query id', async () => {
      databaseMetrics.getTopSlowQueries.mockResolvedValue([
        { calls: 10, maxMs: 200, meanMs: 100, query: 'SELECT 1', queryId: '11', totalMs: 1000 },
        { calls: 5, maxMs: 50, meanMs: 25, query: 'SELECT 2', queryId: '22', totalMs: 125 },
      ]);

      await service.updateDatabaseMetrics();

      expect(mockGaugeReset).toHaveBeenCalledTimes(1);
      expect(mockGaugeSet).toHaveBeenCalledTimes(2);
      expect(mockGaugeSet).toHaveBeenCalledWith({ queryid: '11' }, 100);
      expect(mockGaugeSet).toHaveBeenCalledWith({ queryid: '22' }, 25);
    });
  });
});
