import type { NextFunction, Request, Response } from 'express';

jest.mock('@sentry/node', () => ({
  setContext: jest.fn(),
  setTag: jest.fn(),
}));

import Sentry from '@sentry/node';

import { sentryContextMiddleware } from './sentry-context.middleware';

describe('sentryContextMiddleware', () => {
  describe('positive cases', () => {
    it('sets traceId tag and request context', () => {
      const req = { method: 'GET', url: '/api/todos' } as Request;
      const next = jest.fn() as NextFunction;

      sentryContextMiddleware()(req, {} as Response, next);

      expect(Sentry.setTag).toHaveBeenCalledWith('traceId', expect.any(String));
      expect(Sentry.setContext).toHaveBeenCalledWith('request', {
        method: 'GET',
        url: '/api/todos',
      });
    });

    it('calls next', () => {
      const req = { method: 'POST', url: '/api' } as Request;
      const next = jest.fn() as NextFunction;

      sentryContextMiddleware()(req, {} as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
