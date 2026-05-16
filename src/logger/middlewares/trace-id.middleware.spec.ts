import type { NextFunction, Request, Response } from 'express';

import { traceIdMiddleware } from './trace-id.middleware';

const makeRes = (): { setHeader: jest.Mock } => ({ setHeader: jest.fn() });

const makeReq = (traceId?: string): Request =>
  ({
    headers: traceId ? { 'x-trace-id': traceId } : {},
  }) as unknown as Request;

describe('traceIdMiddleware', () => {
  describe('positive cases', () => {
    it('uses existing traceId from header', (done) => {
      const req = makeReq('existing-id');
      const res = makeRes();
      const next: NextFunction = () => {
        expect(req.headers['x-trace-id']).toBe('existing-id');
        done();
      };

      traceIdMiddleware(req, res as unknown as Response, next);
    });

    it('generates a UUID when header is absent', (done) => {
      const req = makeReq();
      const res = makeRes();
      const next: NextFunction = () => {
        expect(req.headers['x-trace-id']).toMatch(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/);
        done();
      };

      traceIdMiddleware(req, res as unknown as Response, next);
    });

    it('sets the traceId as response header', (done) => {
      const req = makeReq('test-id');
      const res = makeRes();
      const next: NextFunction = () => {
        expect(res.setHeader).toHaveBeenCalledWith('X-Trace-Id', 'test-id');
        done();
      };

      traceIdMiddleware(req, res as unknown as Response, next);
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
