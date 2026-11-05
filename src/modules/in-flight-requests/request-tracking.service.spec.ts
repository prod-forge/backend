import { RequestTrackingService } from './request-tracking.service';

describe('RequestTrackingService', () => {
  let service: RequestTrackingService;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new RequestTrackingService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const track = (promise: Promise<void>): { isDone: () => boolean } => {
    let done = false;
    void promise.then(() => {
      done = true;
    });

    return { isDone: () => done };
  };

  describe('negative cases', () => {
    it('decrement below zero', () => {
      service.decrement();

      expect(service.getActiveRequests()).toBe(-1);
    });

    it('waitForRequestsToFinish resolves immediately when no active requests', async () => {
      await expect(service.waitForRequestsToFinish(1000)).resolves.toBeUndefined();
    });

    it('waitForRequestsToFinish gives up after the default 30 s when requests remain', async () => {
      service.increment();

      const wait = track(service.waitForRequestsToFinish());
      await jest.advanceTimersByTimeAsync(30000);

      expect(wait.isDone()).toBe(false);

      await jest.advanceTimersByTimeAsync(100);

      expect(wait.isDone()).toBe(true);
      expect(service.getActiveRequests()).toBe(1);
    });

    it('waitForRequestsToFinish gives up after the given timeout when requests remain', async () => {
      service.increment();

      const wait = track(service.waitForRequestsToFinish(150));
      await jest.advanceTimersByTimeAsync(100);

      expect(wait.isDone()).toBe(false);

      await jest.advanceTimersByTimeAsync(100);

      expect(wait.isDone()).toBe(true);
    });
  });

  describe('positive cases', () => {
    it('starts at zero', () => {
      expect(service.getActiveRequests()).toBe(0);
    });

    it('increment increases count', () => {
      service.increment();

      expect(service.getActiveRequests()).toBe(1);
    });

    it('decrement decreases count', () => {
      service.increment();
      service.increment();
      service.decrement();

      expect(service.getActiveRequests()).toBe(1);
    });

    it('multiple increments accumulate', () => {
      service.increment();
      service.increment();
      service.increment();

      expect(service.getActiveRequests()).toBe(3);
    });

    it('waitForRequestsToFinish resolves on the next poll after requests finish', async () => {
      service.increment();
      setTimeout(() => service.decrement(), 50);

      const wait = track(service.waitForRequestsToFinish(1000));
      await jest.advanceTimersByTimeAsync(100);

      expect(wait.isDone()).toBe(true);
    });
  });
});
