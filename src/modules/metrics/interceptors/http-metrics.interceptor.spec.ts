import type { CallHandler, ExecutionContext } from '@nestjs/common';

import { lastValueFrom, of, throwError } from 'rxjs';

jest.mock('prom-client', () => {
  const incMock = jest.fn();
  const labelsMock = jest.fn().mockReturnValue({ inc: incMock });
  const observeMock = jest.fn();
  const labelsHistMock = jest.fn().mockReturnValue({ observe: observeMock });

  return {
    Counter: jest.fn().mockImplementation(() => ({ labels: labelsMock })),
    Gauge: jest.fn().mockImplementation(() => ({ dec: jest.fn(), inc: jest.fn() })),
    Histogram: jest.fn().mockImplementation(() => ({ labels: labelsHistMock })),
  };
});

import { HttpMetricsInterceptor } from './http-metrics.interceptor';

const makeContext = (method = 'GET', route = '/api', statusCode = 200): ExecutionContext =>
  ({
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ baseUrl: route, method, route: { path: route } }),
      getResponse: jest.fn().mockReturnValue({ statusCode }),
    }),
  }) as unknown as ExecutionContext;

describe('HttpMetricsInterceptor', () => {
  let interceptor: HttpMetricsInterceptor;

  beforeEach(() => {
    interceptor = new HttpMetricsInterceptor();
  });

  describe('positive cases', () => {
    it('intercept does not throw on success', async () => {
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(of({ id: 1 })) };

      await expect(lastValueFrom(interceptor.intercept(makeContext(), handler))).resolves.toEqual({ id: 1 });
    });

    it('intercept records metrics on error with status', async () => {
      const error = Object.assign(new Error('test'), { status: 400 });
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(throwError(() => error)) };

      await expect(lastValueFrom(interceptor.intercept(makeContext(), handler))).rejects.toBe(error);
    });

    it('uses 500 as fallback status when error has no status property', async () => {
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(throwError(() => new Error('no status'))) };

      await expect(lastValueFrom(interceptor.intercept(makeContext(), handler))).rejects.toThrow('no status');
    });

    it('uses unknown route when route is undefined', async () => {
      const ctx = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ baseUrl: '', method: 'GET', route: { path: '' } }),
          getResponse: jest.fn().mockReturnValue({ statusCode: 200 }),
        }),
      } as unknown as ExecutionContext;

      const handler: CallHandler = { handle: jest.fn().mockReturnValue(of({})) };

      await expect(lastValueFrom(interceptor.intercept(ctx, handler))).resolves.toEqual({});
    });
  });
});
