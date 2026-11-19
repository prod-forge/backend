import type { Request, Response } from 'express';

const mockCounterInc = jest.fn();
const mockCounterLabels = jest.fn(() => ({ inc: mockCounterInc }));
const mockDurationObserve = jest.fn();
const mockDurationLabels = jest.fn(() => ({ observe: mockDurationObserve }));
const mockInFlight = { dec: jest.fn(), inc: jest.fn() };

jest.mock('@prometheus-io/client', () => ({
  Counter: jest.fn().mockImplementation(() => ({ labels: mockCounterLabels })),
  Gauge: jest.fn().mockImplementation(() => mockInFlight),
  Histogram: jest.fn().mockImplementation(() => ({ labels: mockDurationLabels })),
}));

import { isHttpMetricsRecorded, markHttpMetricsRecorded } from '../interceptors/http.metrics';
import { httpMetricsMiddleware } from './http-metrics.middleware';

type ReqRes = {
  fireFinish: () => void;
  next: jest.Mock;
  req: Request;
  res: Response;
};

const makeReqRes = (
  opts: { baseUrl?: string; method?: string; path?: string; route?: { path: string }; statusCode?: number } = {},
): ReqRes => {
  const finishHandlers: (() => void)[] = [];
  const req = {
    baseUrl: opts.baseUrl ?? '',
    method: opts.method ?? 'GET',
    path: opts.path ?? '/api/v1/todos',
    route: 'route' in opts ? opts.route : { path: '/api/v1/todos' },
  } as unknown as Request;
  const res = {
    on: jest.fn((event: string, handler: () => void) => {
      if (event === 'finish') finishHandlers.push(handler);
    }),
    statusCode: opts.statusCode ?? 200,
  } as unknown as Response;

  return {
    fireFinish: () => finishHandlers.forEach((handler) => handler()),
    next: jest.fn(),
    req,
    res,
  };
};

describe('httpMetricsMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('negative cases', () => {
    it('does not record when the interceptor already recorded the request', () => {
      const { fireFinish, next, req, res } = makeReqRes({ statusCode: 200 });
      markHttpMetricsRecorded(req);

      httpMetricsMiddleware(req, res, next);
      fireFinish();

      expect(mockCounterLabels).not.toHaveBeenCalled();
      expect(mockDurationLabels).not.toHaveBeenCalled();
    });

    it('does not record when no route matched', () => {
      const { fireFinish, next, req, res } = makeReqRes({ route: undefined, statusCode: 404 });

      httpMetricsMiddleware(req, res, next);
      fireFinish();

      expect(mockCounterLabels).not.toHaveBeenCalled();
      expect(mockDurationLabels).not.toHaveBeenCalled();
    });

    it('does not record the same request twice if finish fires twice', () => {
      const { fireFinish, next, req, res } = makeReqRes({ statusCode: 401 });

      httpMetricsMiddleware(req, res, next);
      fireFinish();
      fireFinish();

      expect(mockCounterLabels).toHaveBeenCalledTimes(1);
      expect(mockCounterInc).toHaveBeenCalledTimes(1);
      expect(mockDurationObserve).toHaveBeenCalledTimes(1);
    });

    it('does not record before the response finishes', () => {
      const { next, req, res } = makeReqRes({ statusCode: 401 });

      httpMetricsMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(mockCounterLabels).not.toHaveBeenCalled();
    });
  });

  describe('positive cases', () => {
    it('records a 401 guard rejection once with the route template and real status', () => {
      const { fireFinish, next, req, res } = makeReqRes({ statusCode: 401 });

      httpMetricsMiddleware(req, res, next);
      fireFinish();

      expect(mockCounterLabels).toHaveBeenCalledTimes(1);
      expect(mockCounterLabels).toHaveBeenCalledWith('GET', '/api/v1/todos', '401');
      expect(mockCounterInc).toHaveBeenCalledTimes(1);
      expect(mockDurationLabels).toHaveBeenCalledWith('GET', '/api/v1/todos', '401');
      expect(mockDurationObserve).toHaveBeenCalledTimes(1);
      expect(isHttpMetricsRecorded(req)).toBe(true);
    });

    it('records a 429 guard rejection once with the route template and real status', () => {
      const { fireFinish, next, req, res } = makeReqRes({ statusCode: 429 });

      httpMetricsMiddleware(req, res, next);
      fireFinish();

      expect(mockCounterLabels).toHaveBeenCalledTimes(1);
      expect(mockCounterLabels).toHaveBeenCalledWith('GET', '/api/v1/todos', '429');
      expect(mockCounterInc).toHaveBeenCalledTimes(1);
      expect(mockDurationObserve).toHaveBeenCalledTimes(1);
    });

    it('labels with the route template, never the raw url', () => {
      const { fireFinish, next, req, res } = makeReqRes({
        path: '/api/v1/todos/42',
        route: { path: '/api/v1/todos/:id' },
        statusCode: 401,
      });

      httpMetricsMiddleware(req, res, next);
      fireFinish();

      expect(mockCounterLabels).toHaveBeenCalledWith('GET', '/api/v1/todos/:id', '401');
      expect(mockCounterLabels).not.toHaveBeenCalledWith(expect.anything(), '/api/v1/todos/42', expect.anything());
    });

    it('uses baseUrl when the route path is empty, like the interceptor', () => {
      const { fireFinish, next, req, res } = makeReqRes({
        baseUrl: '/api/v1/todos',
        route: { path: '' },
        statusCode: 401,
      });

      httpMetricsMiddleware(req, res, next);
      fireFinish();

      expect(mockCounterLabels).toHaveBeenCalledWith('GET', '/api/v1/todos', '401');
    });
  });
});
