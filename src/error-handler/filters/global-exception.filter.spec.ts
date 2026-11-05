import type { ArgumentsHost } from '@nestjs/common';

import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

jest.mock('@prometheus-io/client', () => ({
  Counter: jest.fn().mockImplementation(() => ({
    labels: jest.fn().mockReturnValue({ inc: jest.fn() }),
  })),
}));

jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
  setUser: jest.fn(),
}));

import { Counter } from '@prometheus-io/client';
import * as Sentry from '@sentry/node';

import type { LoggerService } from '../../logger/logger.service';

import { RequestContext } from '../../logger/context/request-context';
import { InternalServerError } from '../errors/common.errors';
import { TodoNotFoundError } from '../errors/todo.errors';
import { GlobalExceptionFilter } from './global-exception.filter';

jest.mock('../../logger/context/request-context', () => ({
  RequestContext: { getTraceId: jest.fn() },
}));

type MakeHostResult = {
  host: ArgumentsHost;
  jsonMock: jest.Mock;
  res: { status: jest.Mock };
};

const makeHost = (
  opts: {
    method?: string;
    route?: { path: string };
    url?: string;
    userId?: string;
  } = {},
): MakeHostResult => {
  const jsonMock = jest.fn();
  const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
  const res = { status: statusMock };
  const url = opts.url || '/api/todos';
  const req = {
    body: { email: 'user@example.com' },
    header: jest.fn().mockReturnValue(undefined),
    method: opts.method || 'GET',
    params: {},
    path: url.split('?')[0],
    query: {},
    route: opts.route,
    url,
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

const errorsCounterLabels = ((Counter as unknown as jest.Mock).mock.results[0].value as { labels: jest.Mock }).labels;

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let logger: { error: jest.Mock };

  const sentryConfigValue = { sentryDsn: '', sentryEnabled: false, sentryIgnoredErrors: [] };

  beforeEach(() => {
    logger = { error: jest.fn() };
    filter = new GlobalExceptionFilter(logger as unknown as LoggerService, sentryConfigValue);
    jest.clearAllMocks();
    jest.mocked(RequestContext.getTraceId).mockReturnValue('ctx-trace-1');
  });

  describe('negative cases', () => {
    it('handles unknown errors as InternalServerError', () => {
      const { host, res } = makeHost({ route: { path: '/api/todos' } });

      filter.catch('unknown error', host);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('handles 5xx HttpException as InternalServerError', () => {
      const { host, res } = makeHost({ route: { path: '/api' } });

      filter.catch(new HttpException('Bad gateway', HttpStatus.BAD_GATEWAY), host);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('skips error response for health endpoints and returns original HttpException response', () => {
      const { host, jsonMock, res } = makeHost({ url: '/health/check' });

      filter.catch(new HttpException({ status: 'ok' }, HttpStatus.OK), host);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(jsonMock).toHaveBeenCalledWith({ status: 'ok' });
    });

    it('keeps 503 and the Terminus body for a failed health check', () => {
      const { host, jsonMock, res } = makeHost({ url: '/health' });
      const body = { error: { shutdown: { status: 'down' } }, status: 'error' };

      filter.catch(new HttpException(body, HttpStatus.SERVICE_UNAVAILABLE), host);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
      expect(jsonMock).toHaveBeenCalledWith(body);
    });

    it('does not treat a path that only starts with "health" as a health endpoint', () => {
      const { host, res } = makeHost({ url: '/healthz' });

      filter.catch(new HttpException('down', HttpStatus.SERVICE_UNAVAILABLE), host);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('never sends the request body to Sentry', () => {
      filter = new GlobalExceptionFilter(logger as unknown as LoggerService, {
        sentryDsn: '',
        sentryEnabled: true,
        sentryIgnoredErrors: [],
      });
      const { host } = makeHost({ route: { path: '/api/v1/auth/login' }, url: '/api/v1/auth/login' });

      filter.catch(new InternalServerError(), host);

      const [, context] = jest.mocked(Sentry.captureException).mock.calls[0] as [unknown, { extra: object }];
      expect(context.extra).not.toHaveProperty('body');
      expect(JSON.stringify(context)).not.toContain('user@example.com');
    });

    it.each([
      ['NotFoundException', new NotFoundException('Cannot GET /x'), HttpStatus.NOT_FOUND],
      ['ThrottlerException', new ThrottlerException(), HttpStatus.TOO_MANY_REQUESTS],
      ['malformed body', new HttpException('Bad', HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST],
    ])('keeps the status and skips Sentry for %s', (_name, exception, status) => {
      filter = new GlobalExceptionFilter(logger as unknown as LoggerService, {
        sentryDsn: '',
        sentryEnabled: true,
        sentryIgnoredErrors: [],
      });
      const { host, res } = makeHost({ route: { path: '/api' } });

      filter.catch(exception, host);

      expect(res.status).toHaveBeenCalledWith(status);
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('never sends the query string to Sentry', () => {
      filter = new GlobalExceptionFilter(logger as unknown as LoggerService, {
        sentryDsn: '',
        sentryEnabled: true,
        sentryIgnoredErrors: [],
      });
      const { host } = makeHost({ route: { path: '/api/v1/todos' }, url: '/api/v1/todos?search=private' });

      filter.catch(new InternalServerError(), host);

      const [, context] = jest.mocked(Sentry.captureException).mock.calls[0] as [unknown, { extra: object }];
      expect(context.extra).not.toHaveProperty('query');
      expect(context.extra).toHaveProperty('path', '/api/v1/todos');
      expect(JSON.stringify(context)).not.toContain('search=private');
    });

    it('does not capture domain 4xx errors in Sentry', () => {
      filter = new GlobalExceptionFilter(logger as unknown as LoggerService, {
        sentryDsn: '',
        sentryEnabled: true,
        sentryIgnoredErrors: [],
      });
      const { host } = makeHost({ route: { path: '/api/todos' } });

      filter.catch(new TodoNotFoundError('todo-1'), host);

      expect(Sentry.captureException).not.toHaveBeenCalled();
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

    it('captures InternalServerError once with the request context trace id', () => {
      filter = new GlobalExceptionFilter(logger as unknown as LoggerService, {
        sentryDsn: '',
        sentryEnabled: true,
        sentryIgnoredErrors: [],
      });
      const { host } = makeHost({ route: { path: '/api' } });
      const error = new InternalServerError();

      filter.catch(error, host);

      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({ extra: expect.objectContaining({ traceId: 'ctx-trace-1' }) as unknown }),
      );
    });

    it.each(['/HEALTH', '/Health/Deps', '/health/deps?verbose=1'])(
      'keeps the Terminus 503 for %s (Express routing is case-insensitive)',
      (url) => {
        const { host, res } = makeHost({ url });

        filter.catch(new HttpException({ status: 'error' }, HttpStatus.SERVICE_UNAVAILABLE), host);

        expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
      },
    );

    it('captures exception via Sentry when enabled', () => {
      filter = new GlobalExceptionFilter(logger as unknown as LoggerService, {
        sentryDsn: '',
        sentryEnabled: true,
        sentryIgnoredErrors: [],
      });
      const { host } = makeHost({ route: { path: '/api' }, userId: 'user-1' });

      filter.catch(new Error('test'), host);

      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('sets Sentry user when userId present', () => {
      filter = new GlobalExceptionFilter(logger as unknown as LoggerService, {
        sentryDsn: '',
        sentryEnabled: true,
        sentryIgnoredErrors: [],
      });
      const { host } = makeHost({ route: { path: '/api' }, userId: 'user-42' });

      filter.catch(new Error('test'), host);

      expect(Sentry.setUser).toHaveBeenCalledWith({ userId: 'user-42' });
    });

    it('does not call Sentry.setUser when userId is absent', () => {
      filter = new GlobalExceptionFilter(logger as unknown as LoggerService, {
        sentryDsn: '',
        sentryEnabled: true,
        sentryIgnoredErrors: [],
      });
      const { host } = makeHost({ route: { path: '/api' } });

      filter.catch(new Error('test'), host);

      expect(Sentry.setUser).not.toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('labels http_errors_total with a fixed value, never the raw url, when no route matched', () => {
      const { host } = makeHost({ url: '/api/todos/9c226319?email=a@b.c' });

      filter.catch(new TodoNotFoundError('x'), host);

      expect(errorsCounterLabels).toHaveBeenCalledWith('GET', 'unmatched', '404');
    });

    it('labels http_errors_total with the route template when a route matched', () => {
      const { host } = makeHost({ route: { path: '/api/todos/:id' }, url: '/api/todos/42' });

      filter.catch(new TodoNotFoundError('x'), host);

      expect(errorsCounterLabels).toHaveBeenCalledWith('GET', '/api/todos/:id', '404');
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
