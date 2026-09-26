import type { NextFunction, Request, Response } from 'express';

import { RequestTrackingMiddleware } from './request-tracking.middleware';
import { RequestTrackingService } from './request-tracking.service';

const makeResMock = (): { handlers: Record<string, () => void>; on: jest.Mock } => {
  const handlers: Record<string, () => void> = {};

  return {
    handlers,
    on: jest.fn((event: string, handler: () => void) => {
      handlers[event] = handler;
    }),
  };
};

describe('RequestTrackingMiddleware', () => {
  let middleware: RequestTrackingMiddleware;
  let tracker: RequestTrackingService;

  beforeEach(() => {
    tracker = new RequestTrackingService();
    middleware = new RequestTrackingMiddleware(tracker);
  });

  describe('positive cases', () => {
    it('increments counter and calls next', () => {
      const res = makeResMock();
      const next = jest.fn() as NextFunction;

      middleware.use({} as Request, res as unknown as Response, next);

      expect(tracker.getActiveRequests()).toBe(1);
      expect(next).toHaveBeenCalled();
    });

    it('decrements counter on finish event', () => {
      const res = makeResMock();
      const next = jest.fn() as NextFunction;

      middleware.use({} as Request, res as unknown as Response, next);
      res.handlers.finish();

      expect(tracker.getActiveRequests()).toBe(0);
    });

    it('decrements counter on close event', () => {
      const res = makeResMock();
      const next = jest.fn() as NextFunction;

      middleware.use({} as Request, res as unknown as Response, next);
      res.handlers.close();

      expect(tracker.getActiveRequests()).toBe(0);
    });

    it('registers both finish and close listeners', () => {
      const res = makeResMock();

      middleware.use({} as Request, res as unknown as Response, jest.fn() as NextFunction);

      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(res.on).toHaveBeenCalledWith('close', expect.any(Function));
    });
  });
});
