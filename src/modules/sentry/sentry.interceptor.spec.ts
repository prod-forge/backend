import type { CallHandler, ExecutionContext } from '@nestjs/common';

import { lastValueFrom, of, throwError } from 'rxjs';

jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
}));

import * as Sentry from '@sentry/node';

import { SentryInterceptor } from './sentry.interceptor';

const makeContext = (): ExecutionContext =>
  ({
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ body: {}, method: 'GET', url: '/api' }),
    }),
  }) as unknown as ExecutionContext;

describe('SentryInterceptor', () => {
  let interceptor: SentryInterceptor;

  beforeEach(() => {
    interceptor = new SentryInterceptor();
    jest.clearAllMocks();
  });

  describe('negative cases', () => {
    it('captures exception and rethrows on error', async () => {
      const error = new Error('test error');
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(throwError(() => error)) };

      await expect(lastValueFrom(interceptor.intercept(makeContext(), handler))).rejects.toBe(error);
      expect(Sentry.captureException).toHaveBeenCalledWith(error, expect.any(Object));
    });
  });

  describe('positive cases', () => {
    it('passes through successful responses without capturing', async () => {
      const handler: CallHandler = { handle: jest.fn().mockReturnValue(of({ id: 1 })) };

      await expect(lastValueFrom(interceptor.intercept(makeContext(), handler))).resolves.toEqual({ id: 1 });
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });
});
