import type { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';

import { Reflector } from '@nestjs/core';

import type { AuthService } from '../../modules/auth/auth.service';

import { UserIsNotAuthorizedError } from '../../error-handler/errors/user.errors';
import { UserThrottlerGuard } from './user-throttler.guard';

type TrackerRequest = { headers: Record<string, string | undefined>; ip?: string; userId?: string };

class TestableGuard extends UserThrottlerGuard {
  track(req: TrackerRequest): Promise<string> {
    return this.getTracker(req);
  }
}

const makeRequest = (overrides: Partial<TrackerRequest> = {}): TrackerRequest => ({
  headers: {},
  ip: '10.0.0.1',
  ...overrides,
});

describe('UserThrottlerGuard', () => {
  let guard: TestableGuard;
  let verifyToken: jest.Mock;

  beforeEach(() => {
    verifyToken = jest.fn();
    guard = new TestableGuard([] as ThrottlerModuleOptions, {} as ThrottlerStorage, new Reflector(), {
      verifyToken,
    } as unknown as AuthService);
  });

  describe('negative cases', () => {
    it('tracks two anonymous requests from different IPs separately', async () => {
      const first = await guard.track(makeRequest({ ip: '10.0.0.1' }));
      const second = await guard.track(makeRequest({ ip: '10.0.0.2' }));

      expect(first).not.toBe(second);
    });

    it('falls back to the IP when the token is invalid', async () => {
      verifyToken.mockRejectedValue(new UserIsNotAuthorizedError());

      const tracker = await guard.track(makeRequest({ headers: { authorization: 'Bearer bad.token' } }));

      expect(tracker).toBe('ip:10.0.0.1');
    });

    it('does not verify a token that is not a Bearer token', async () => {
      const tracker = await guard.track(makeRequest({ headers: { authorization: 'Basic dXNlcjE=' } }));

      expect(tracker).toBe('ip:10.0.0.1');
      expect(verifyToken).not.toHaveBeenCalled();
    });
  });

  describe('positive cases', () => {
    it('tracks by IP when there is no user and no token', async () => {
      expect(await guard.track(makeRequest())).toBe('ip:10.0.0.1');
    });

    it('tracks by user when req.userId is already set', async () => {
      expect(await guard.track(makeRequest({ userId: 'user-1' }))).toBe('user:user-1');
      expect(verifyToken).not.toHaveBeenCalled();
    });

    it('derives the user from a valid Bearer token when the auth guard has not run yet', async () => {
      verifyToken.mockResolvedValue({ userId: 'user-2' });

      const tracker = await guard.track(makeRequest({ headers: { authorization: 'Bearer good.token' } }));

      expect(verifyToken).toHaveBeenCalledWith('good.token');
      expect(tracker).toBe('user:user-2');
    });
  });
});
