import type { ExecutionContext } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import type { AuthService } from '../../modules/auth/auth.service';

import { UserIsNotAuthorizedError } from '../../error-handler/errors/user.errors';
import { AuthGuard } from './auth.guard';

const makeContext = (req: Record<string, unknown>): ExecutionContext =>
  ({
    getClass: jest.fn(),
    getHandler: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({ getRequest: jest.fn().mockReturnValue(req) }),
  }) as unknown as ExecutionContext;

const makeRequest = (auth?: string): Record<string, unknown> => ({ header: jest.fn().mockReturnValue(auth) });

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: Reflector;
  let verifyToken: jest.Mock;

  beforeEach(() => {
    reflector = new Reflector();
    verifyToken = jest.fn();
    guard = new AuthGuard(reflector, { verifyToken } as unknown as AuthService);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
  });

  describe('negative cases', () => {
    it('throws when Authorization header is absent', async () => {
      await expect(guard.canActivate(makeContext(makeRequest()))).rejects.toThrow(UserIsNotAuthorizedError);
    });

    it('throws when Authorization prefix is not Bearer', async () => {
      await expect(guard.canActivate(makeContext(makeRequest('Basic dXNlcjE=')))).rejects.toThrow(
        UserIsNotAuthorizedError,
      );
      expect(verifyToken).not.toHaveBeenCalled();
    });

    it('throws when the token is invalid', async () => {
      verifyToken.mockRejectedValue(new UserIsNotAuthorizedError());

      await expect(guard.canActivate(makeContext(makeRequest('Bearer bad.token')))).rejects.toThrow(
        UserIsNotAuthorizedError,
      );
    });
  });

  describe('positive cases', () => {
    it('returns true for public routes without checking auth', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      await expect(guard.canActivate(makeContext(makeRequest()))).resolves.toBe(true);
      expect(verifyToken).not.toHaveBeenCalled();
    });

    it('sets userId on request from a valid Bearer token', async () => {
      verifyToken.mockResolvedValue({ userId: 'user-123' });
      const req = makeRequest('Bearer valid.token');

      await expect(guard.canActivate(makeContext(req))).resolves.toBe(true);
      expect(verifyToken).toHaveBeenCalledWith('valid.token');
      expect(req.userId).toBe('user-123');
    });
  });
});
