import type { NextFunction, Request, Response } from 'express';

import type { LogConfigInterface } from '../../config/interfaces/log-config.interface';
import type { LoggerService } from '../logger.service';

import { loggingMiddleware } from './logging.middleware';

const makeConfig = (excludeEndpoints: string[] = []): LogConfigInterface =>
  ({ logExcludeEndpoints: excludeEndpoints }) as LogConfigInterface;

const makeLogger = (): { debug: jest.Mock; log: jest.Mock } => ({ debug: jest.fn(), log: jest.fn() });

const makeReq = (url: string, method = 'GET', body = {}): Request =>
  ({ body, method, path: url.split('?')[0], url }) as unknown as Request;

describe('loggingMiddleware', () => {
  describe('negative cases', () => {
    it('skips logging for /health endpoint', () => {
      const logger = makeLogger();
      const next = jest.fn() as NextFunction;
      const middleware = loggingMiddleware(makeConfig(), logger as unknown as LoggerService);

      middleware(makeReq('/health'), {} as Response, next);

      expect(logger.log).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('skips logging for /metrics endpoint', () => {
      const logger = makeLogger();
      const next = jest.fn() as NextFunction;
      const middleware = loggingMiddleware(makeConfig(), logger as unknown as LoggerService);

      middleware(makeReq('/metrics'), {} as Response, next);

      expect(logger.log).not.toHaveBeenCalled();
    });

    it.each(['/health/live', '/health/deps', '/metrics/database'])('skips logging for the %s sub-route', (url) => {
      const logger = makeLogger();
      const middleware = loggingMiddleware(makeConfig(), logger as unknown as LoggerService);

      middleware(makeReq(url), {} as Response, jest.fn());

      expect(logger.log).not.toHaveBeenCalled();
      expect(logger.debug).not.toHaveBeenCalled();
    });

    it('skips logging for custom excluded endpoints', () => {
      const logger = makeLogger();
      const next = jest.fn() as NextFunction;
      const middleware = loggingMiddleware(makeConfig(['/excluded']), logger as unknown as LoggerService);

      middleware(makeReq('/excluded'), {} as Response, next);

      expect(logger.log).not.toHaveBeenCalled();
    });

    it('never puts the request body or query string in the info log', () => {
      const logger = makeLogger();
      const middleware = loggingMiddleware(makeConfig(), logger as unknown as LoggerService);
      const body = { email: 'a@b.c', password: 'secret' };

      middleware(makeReq('/api/todos?email=a@b.c', 'POST', body), {} as Response, jest.fn());

      const [entry] = logger.log.mock.calls[0] as [Record<string, unknown>];

      expect(JSON.stringify(entry)).not.toMatch(/secret|a@b\.c/);
      expect(entry).not.toHaveProperty('details');
      expect(entry).not.toHaveProperty('req');
    });
  });

  describe('positive cases', () => {
    it('logs request for non-excluded endpoints', () => {
      const logger = makeLogger();
      const next = jest.fn() as NextFunction;
      const middleware = loggingMiddleware(makeConfig(), logger as unknown as LoggerService);

      middleware(makeReq('/api/todos', 'POST', { title: 'test' }), {} as Response, next);

      expect(logger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          ctx: 'loggingMiddleware',
          method: 'POST',
          msg: 'Request income',
          path: '/api/todos',
        }),
      );
    });

    it('calls next after logging', () => {
      const logger = makeLogger();
      const next = jest.fn() as NextFunction;
      const middleware = loggingMiddleware(makeConfig(), logger as unknown as LoggerService);

      middleware(makeReq('/api/todos'), {} as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('passes the body only to the debug log', () => {
      const logger = makeLogger();
      const middleware = loggingMiddleware(makeConfig(), logger as unknown as LoggerService);
      const body = { title: 'test' };

      middleware(makeReq('/api/todos', 'POST', body), {} as Response, jest.fn());

      expect(logger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'POST', path: '/api/todos', req: { body } }),
      );
    });
  });
});
