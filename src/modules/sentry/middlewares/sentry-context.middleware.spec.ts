import type { NextFunction, Request, Response } from 'express';

jest.mock('@sentry/node', () => ({
  setContext: jest.fn(),
  setTag: jest.fn(),
}));

import * as Sentry from '@sentry/node';

import { sentryContextMiddleware } from './sentry-context.middleware';

describe('sentryContextMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('negative cases', () => {
    it('never sends the query string to Sentry', () => {
      const req = { method: 'GET', path: '/api/v1/todos', url: '/api/v1/todos?search=private' } as Request;

      sentryContextMiddleware()(req, {} as Response, jest.fn() as NextFunction);

      expect(JSON.stringify(jest.mocked(Sentry.setContext).mock.calls)).not.toContain('search=private');
    });
  });

  describe('positive cases', () => {
    it('sets traceId tag and request context with the path', () => {
      const req = { method: 'GET', path: '/api/todos', url: '/api/todos' } as Request;
      const next = jest.fn() as NextFunction;

      sentryContextMiddleware()(req, {} as Response, next);

      expect(Sentry.setTag).toHaveBeenCalledWith('traceId', expect.any(String));
      expect(Sentry.setContext).toHaveBeenCalledWith('request', {
        method: 'GET',
        path: '/api/todos',
      });
    });

    it('calls next', () => {
      const req = { method: 'POST', path: '/api', url: '/api' } as Request;
      const next = jest.fn() as NextFunction;

      sentryContextMiddleware()(req, {} as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
