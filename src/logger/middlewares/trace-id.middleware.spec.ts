import type { NextFunction, Request, Response } from 'express';

import { trace } from '@opentelemetry/api';

import { RequestContext } from '../context/request-context';
import { traceIdMiddleware } from './trace-id.middleware';

const makeRes = (): { setHeader: jest.Mock } => ({ setHeader: jest.fn() });

const makeReq = (traceId?: string): Request =>
  ({
    headers: traceId ? { 'x-trace-id': traceId } : {},
  }) as unknown as Request;

const otelTraceId = '4bf92f3577b34da6a3ce929d0e0e4736';

const mockActiveSpan = (): jest.SpyInstance =>
  jest.spyOn(trace, 'getActiveSpan').mockReturnValue({
    spanContext: () => ({ spanId: '00f067aa0ba902b7', traceFlags: 1, traceId: otelTraceId }),
  } as unknown as ReturnType<typeof trace.getActiveSpan>);

describe('traceIdMiddleware', () => {
  afterEach(() => jest.restoreAllMocks());

  describe('negative cases', () => {
    it('generates a random UUID when there is no active span and no header', () => {
      const req = makeReq();
      const next = jest.fn() as NextFunction;

      traceIdMiddleware(req, makeRes() as unknown as Response, next);

      expect(req.headers['x-trace-id']).not.toBe(otelTraceId);
      expect(req.headers['x-trace-id']).toMatch(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/);
    });

    it.each([
      ['too long', 'a'.repeat(65)],
      ['with a line break', 'id\nforged log line'],
      ['with spaces', 'not a trace id'],
    ])('ignores an incoming trace id that is %s and generates a UUID', (_case, incoming) => {
      const req = makeReq(incoming);
      const res = makeRes();

      traceIdMiddleware(req, res as unknown as Response, jest.fn() as NextFunction);

      expect(req.headers['x-trace-id']).not.toBe(incoming);
      expect(res.setHeader).not.toHaveBeenCalledWith('X-Trace-Id', incoming);
    });

    it('ignores a repeated trace id header', () => {
      const req = { headers: { 'x-trace-id': ['a', 'b'] } } as unknown as Request;

      traceIdMiddleware(req, makeRes() as unknown as Response, jest.fn() as NextFunction);

      expect(req.headers['x-trace-id']).toMatch(/^[\da-f-]{36}$/);
    });
  });

  describe('positive cases', () => {
    it('prefers the active span traceId for the header, response and RequestContext', () => {
      mockActiveSpan();
      const req = makeReq('incoming-id');
      const res = makeRes();
      let contextId: string | undefined;
      const next = jest.fn(() => {
        contextId = RequestContext.getTraceId();
      }) as unknown as NextFunction;

      traceIdMiddleware(req, res as unknown as Response, next);

      expect(req.headers['x-trace-id']).toBe(otelTraceId);
      expect(res.setHeader).toHaveBeenCalledWith('X-Trace-Id', otelTraceId);
      expect(contextId).toBe(otelTraceId);
    });

    it('uses existing traceId from header', () => {
      const req = makeReq('existing-id');
      const res = makeRes();
      const next = jest.fn() as NextFunction;

      traceIdMiddleware(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.headers['x-trace-id']).toBe('existing-id');
    });

    it('generates a UUID when header is absent', () => {
      const req = makeReq();
      const res = makeRes();
      const next = jest.fn() as NextFunction;

      traceIdMiddleware(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.headers['x-trace-id']).toMatch(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/);
    });

    it('sets the traceId as response header', () => {
      const req = makeReq('test-id');
      const res = makeRes();
      const next = jest.fn() as NextFunction;

      traceIdMiddleware(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.setHeader).toHaveBeenCalledWith('X-Trace-Id', 'test-id');
    });

    it('calls next', () => {
      const req = makeReq('id');
      const res = makeRes();
      const next = jest.fn() as NextFunction;

      traceIdMiddleware(req, res as unknown as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
