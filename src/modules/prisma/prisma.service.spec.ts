jest.mock('../../../database-manager/generated/client', () => {
  class MockPrismaClient {
    $connect = jest.fn().mockResolvedValue(undefined);
    $on = jest.fn();
    $queryRaw = jest.fn().mockResolvedValue([]);
  }

  return { PrismaClient: MockPrismaClient };
});

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));

const mockObserve = jest.fn();
const mockInc = jest.fn();

jest.mock('./prisma.metrics', () => ({
  prismaQueriesTotal: { inc: mockInc },
  prismaQueryDuration: { observe: mockObserve },
}));

import { PrismaPg } from '@prisma/adapter-pg';

import type { LoggerService } from '../../logger/logger.service';

import { RequestContext } from '../../logger/context/request-context';
import { PrismaService } from './prisma.service';

const makeService = (failFast = false, logLevels: string[] = []): [PrismaService, { error: jest.Mock }] => {
  const logger = { error: jest.fn() };
  const config = {
    databaseConnectTimeoutMs: 5000,
    databaseFailFast: failFast,
    databaseLogLevels: logLevels,
    databasePoolMax: 10,
    databaseStatementTimeoutMs: 5000,
    databaseUrl: 'postgresql://test:test@localhost:5432/test',
  };

  const service = new PrismaService(config as never, logger as unknown as LoggerService);

  return [service, logger];
};

const getQueryHandler = (service: PrismaService): ((e: { duration: number }) => void) => {
  const [[, handler]] = (service.$on as unknown as jest.Mock<void, [string, (e: { duration: number }) => void]>).mock
    .calls;

  return handler;
};

describe('PrismaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('negative cases', () => {
    it('logs error when connect fails and databaseFailFast is false', async () => {
      const [service, logger] = makeService(false);
      jest.spyOn(service, '$connect').mockRejectedValue(new Error('connection refused'));

      await service.onModuleInit();

      expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ msg: 'Prisma failed' }));
    });

    it('calls process.exit(1) when connect fails and databaseFailFast is true', async () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const [service] = makeService(true);
      jest.spyOn(service, '$connect').mockRejectedValue(new Error('connection refused'));

      await service.onModuleInit();

      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });
  });

  describe('positive cases', () => {
    it('passes pool size and timeouts to the pg adapter', () => {
      makeService();

      expect(PrismaPg).toHaveBeenCalledWith({
        connectionString: 'postgresql://test:test@localhost:5432/test',
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        max: 10,
        // eslint-disable-next-line camelcase -- pg option name
        statement_timeout: 5000,
      });
    });

    it('subscribes to query events once', () => {
      const [service] = makeService();

      expect(service.$on).toHaveBeenCalledTimes(1);
      expect(service.$on).toHaveBeenCalledWith('query', expect.any(Function));
    });

    it('observes query duration in seconds and counts the query', () => {
      const [service] = makeService();
      const onQuery = getQueryHandler(service);

      onQuery({ duration: 25 });

      expect(mockObserve).toHaveBeenCalledWith(0.025);
      expect(mockInc).toHaveBeenCalledTimes(1);
    });

    it('increments the per-request query count', () => {
      const [service] = makeService();
      const onQuery = getQueryHandler(service);
      let count = 0;

      RequestContext.run('trace', () => {
        onQuery({ duration: 1 });
        onQuery({ duration: 2 });
        count = RequestContext.getQueryCount();
      });

      expect(count).toBe(2);
    });

    it('onModuleInit connects without error', async () => {
      const [service] = makeService();

      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });
});
