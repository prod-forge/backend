import type { ArgumentsHost } from '@nestjs/common';

import { HttpException, HttpStatus } from '@nestjs/common';

jest.mock('prom-client', () => ({
  Counter: jest.fn().mockImplementation(() => ({
    labels: jest.fn().mockReturnValue({ inc: jest.fn() }),
  })),
}));

jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
  setUser: jest.fn(),
}));

import * as Sentry from '@sentry/node';

import type { LoggerService } from '../../logger/logger.service';

import { InternalServerError } from '../errors/common.errors';
import { TodoNotFoundError } from '../errors/todo.errors';
import { GlobalExceptionFilter } from './global-exception.filter';

interface MakeHostResult {
  host: ArgumentsHost;
  jsonMock: jest.Mock;
  res: { status: jest.Mock };
}

const makeHost = (
  opts: {
    method?: string;
    route?: { path: string };
    traceId?: string;
    url?: string;
    userId?: string;
  } = {},
): MakeHostResult => {
  const jsonMock = jest.fn();
  const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
  const res = { status: statusMock };
  const req = {
    body: {},
    header: jest.fn().mockReturnValue(undefined),
    method: opts.method || 'GET',
    params: {},
    query: {},
    route: opts.route,
    traceId: opts.traceId || 'trace-1',
    url: opts.url || '/api/todos',
    userId: opts.userId,
  };

  return {
    host: {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(req),
        getResponse: jest.fn().mockReturnValue(res),
      }),
    } as unknown as ArgumentsHost,
    jsonMock,
    res,
  };
};

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let logger: { error: jest.Mock };

  const sentryConfigValue = { sentryEnabled: false, sentryIgnoredErrors: [] };

  beforeEach(() => {
    logger = { error: jest.fn() };
    filter = new GlobalExceptionFilter(logger as unknown as LoggerService, sentryConfigValue as never);
    jest.clearAllMocks();
  });

  describe('negative cases', () => {
    it('handles unknown errors as InternalServerError', () => {
      const { host, res } = makeHost({ route: { path: '/api/todos' } });

      filter.catch('unknown error', host);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('handles HttpException as InternalServerError', () => {
      const { host, res } = makeHost({ route: { path: '/api' } });

      filter.catch(new HttpException('Forbidden', HttpStatus.FORBIDDEN), host);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('skips error response for health endpoints and returns original HttpException response', () => {
      const { host, jsonMock, res } = makeHost({ url: '/health/check' });

      filter.catch(new HttpException({ status: 'ok' }, HttpStatus.OK), host);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(jsonMock).toHaveBeenCalledWith({ status: 'ok' });
    });
  });

  describe('positive cases', () => {
    it('handles BaseError directly', () => {
      const { host, res } = makeHost({ route: { path: '/api/todos' } });
      const error = new TodoNotFoundError('todo-1');

      filter.catch(error, host);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    it('logs error for each exception', () => {
      const { host } = makeHost({ route: { path: '/api' } });

      filter.catch(new Error('test'), host);

      expect(logger.error).toHaveBeenCalled();
    });

    it('captures exception via Sentry when enabled', () => {
      filter = new GlobalExceptionFilter(logger as unknown as LoggerService, { sentryEnabled: true } as never);
      const { host } = makeHost({ route: { path: '/api' }, userId: 'user-1' });

      filter.catch(new Error('test'), host);

      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('sets Sentry user when userId present', () => {
      filter = new GlobalExceptionFilter(logger as unknown as LoggerService, { sentryEnabled: true } as never);
      const { host } = makeHost({ route: { path: '/api' }, userId: 'user-42' });

      filter.catch(new Error('test'), host);

      expect(Sentry.setUser).toHaveBeenCalledWith({ userId: 'user-42' });
    });

    it('includes details in response when BaseError has details', () => {
      const { host, jsonMock } = makeHost({ route: { path: '/api/todos' } });

      filter.catch(new TodoNotFoundError('todo-42'), host);

      const call = (jsonMock.mock.calls as [Record<string, unknown>][])[0][0];
      expect(call.details).toBeDefined();
    });

    it('omits details from response for InternalServerError', () => {
      const { host, jsonMock } = makeHost({ route: { path: '/api' } });

      filter.catch(new InternalServerError(), host);

      const call = (jsonMock.mock.calls as [Record<string, unknown>][])[0][0];
      expect(call.details).toBeUndefined();
    });
  });
});
