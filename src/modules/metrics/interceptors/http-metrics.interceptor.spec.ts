import type { CallHandler, ExecutionContext } from '@nestjs/common';

import { HttpException } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';

const mockInFlight = { dec: jest.fn(), inc: jest.fn() };
const mockCounterInc = jest.fn();
const mockCounterLabels = jest.fn(() => ({ inc: mockCounterInc }));
const mockDurationObserve = jest.fn();
const mockDurationLabels = jest.fn(() => ({ observe: mockDurationObserve }));
const mockQueriesObserve = jest.fn();

jest.mock('prom-client', () => ({
  Counter: jest.fn().mockImplementation(() => ({ labels: mockCounterLabels })),
  Gauge: jest.fn().mockImplementation(() => mockInFlight),
  Histogram: jest
    .fn()
    .mockImplementation(({ name }: { name: string }) =>
      name === 'prisma_queries_per_request' ? { observe: mockQueriesObserve } : { labels: mockDurationLabels },
    ),
}));

import { Prisma } from '../../../../database-manager/generated/client';
import { TodoNotFoundError } from '../../../error-handler/errors/todo.errors';
import { RequestContext } from '../../../logger/context/request-context';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';

const makeContext = (method = 'GET', route = '/api/v1/todos/:id', statusCode = 200): ExecutionContext =>
  ({
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest
        .fn()
        .mockReturnValue({ baseUrl: '', method, originalUrl: '/api/v1/todos/42', route: { path: route } }),
      getResponse: jest.fn().mockReturnValue({ statusCode }),
    }),
  }) as unknown as ExecutionContext;

describe('HttpMetricsInterceptor', () => {
  let interceptor: HttpMetricsInterceptor;

  beforeEach(() => {
    jest.clearAllMocks();
    interceptor = new HttpMetricsInterceptor();
  });

  describe('negative cases', () => {
    it('records the error status once and rethrows when the handler throws', async () => {
      const error = new TodoNotFoundError('42');
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(throwError(() => error)) };

      await expect(lastValueFrom(interceptor.intercept(makeContext(), handler))).rejects.toBe(error);

      expect(mockCounterLabels).toHaveBeenCalledTimes(1);
      expect(mockCounterLabels).toHaveBeenCalledWith('GET', '/api/v1/todos/:id', '404');
      expect(mockCounterInc).toHaveBeenCalledTimes(1);
      expect(mockDurationObserve).toHaveBeenCalledTimes(1);
    });

    it('returns in-flight to its previous value when the handler throws', async () => {
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(throwError(() => new Error('boom'))) };

      await expect(lastValueFrom(interceptor.intercept(makeContext(), handler))).rejects.toThrow('boom');

      expect(mockInFlight.inc).toHaveBeenCalledTimes(1);
      expect(mockInFlight.dec).toHaveBeenCalledTimes(1);
    });

    it('labels a Prisma P2025 error with 404 like the exception filter', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('not found', { clientVersion: 'test', code: 'P2025' });
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(throwError(() => error)) };

      await expect(lastValueFrom(interceptor.intercept(makeContext(), handler))).rejects.toBe(error);

      expect(mockCounterLabels).toHaveBeenCalledWith('GET', '/api/v1/todos/:id', '404');
    });

    it('labels a 5xx HttpException with 500 like the exception filter', async () => {
      const error = new HttpException('bad gateway', 502);
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(throwError(() => error)) };

      await expect(lastValueFrom(interceptor.intercept(makeContext(), handler))).rejects.toBe(error);

      expect(mockCounterLabels).toHaveBeenCalledWith('GET', '/api/v1/todos/:id', '500');
    });

    it('keeps the status of a 4xx HttpException like the exception filter', async () => {
      const error = new HttpException('teapot', 418);
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(throwError(() => error)) };

      await expect(lastValueFrom(interceptor.intercept(makeContext(), handler))).rejects.toBe(error);

      expect(mockCounterLabels).toHaveBeenCalledWith('GET', '/api/v1/todos/:id', '418');
    });

    it('uses 500 as fallback status when the error has no status', async () => {
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(throwError(() => new Error('no status'))) };

      await expect(lastValueFrom(interceptor.intercept(makeContext(), handler))).rejects.toThrow('no status');

      expect(mockCounterLabels).toHaveBeenCalledWith('GET', '/api/v1/todos/:id', '500');
    });

    it('uses unknown route when the route path is empty and there is no base url', async () => {
      const ctx = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ baseUrl: '', method: 'GET', route: { path: '' } }),
          getResponse: jest.fn().mockReturnValue({ statusCode: 200 }),
        }),
      } as unknown as ExecutionContext;
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(of({})) };

      await lastValueFrom(interceptor.intercept(ctx, handler));

      expect(mockCounterLabels).toHaveBeenCalledWith('GET', 'unknown', '200');
    });
  });

  describe('positive cases', () => {
    it('records the response status once on success', async () => {
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(of({ id: 1 })) };

      await expect(
        lastValueFrom(interceptor.intercept(makeContext('GET', '/api/v1/todos/:id', 201), handler)),
      ).resolves.toEqual({
        id: 1,
      });

      expect(mockCounterLabels).toHaveBeenCalledTimes(1);
      expect(mockCounterLabels).toHaveBeenCalledWith('GET', '/api/v1/todos/:id', '201');
      expect(mockCounterInc).toHaveBeenCalledTimes(1);
      expect(mockDurationObserve).toHaveBeenCalledTimes(1);
      expect(mockInFlight.inc).toHaveBeenCalledTimes(1);
      expect(mockInFlight.dec).toHaveBeenCalledTimes(1);
    });

    it('labels with the route template, never the raw url', async () => {
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(of({})) };

      await lastValueFrom(interceptor.intercept(makeContext(), handler));

      expect(mockCounterLabels).not.toHaveBeenCalledWith(expect.anything(), '/api/v1/todos/42', expect.anything());
    });

    it('observes the number of queries made during the request', async () => {
      const handler: CallHandler = {
        handle: jest.fn().mockImplementation(() => {
          RequestContext.incrementQueryCount();
          RequestContext.incrementQueryCount();
          RequestContext.incrementQueryCount();

          return of({});
        }),
      };

      await new Promise<void>((resolve, reject) => {
        RequestContext.run('trace', () => {
          lastValueFrom(interceptor.intercept(makeContext(), handler)).then(() => resolve(), reject);
        });
      });

      expect(mockQueriesObserve).toHaveBeenCalledTimes(1);
      expect(mockQueriesObserve).toHaveBeenCalledWith(3);
    });
  });
});
