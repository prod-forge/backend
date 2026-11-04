import type { ConfigService } from '@nestjs/config';

import type { UsersService } from '../../features/users/users.service';

import { UserIsNotAuthorizedError } from '../../error-handler/errors/user.errors';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  const issueTokenByEmail = jest.fn();
  const getOrThrow = jest.fn().mockReturnValue({ jwtTtl: 3600 });
  const controller = new AuthController(
    { issueTokenByEmail } as unknown as UsersService,
    { getOrThrow } as unknown as ConfigService,
  );

  beforeEach(() => jest.clearAllMocks());

  describe('negative cases', () => {
    it('propagates the error for an unknown email', async () => {
      issueTokenByEmail.mockRejectedValue(new UserIsNotAuthorizedError());

      await expect(controller.login({ email: 'nobody@example.com' })).rejects.toThrow(UserIsNotAuthorizedError);
    });
  });

  describe('positive cases', () => {
    it('returns a token and its lifetime', async () => {
      issueTokenByEmail.mockResolvedValue('signed.jwt.token');

      await expect(controller.login({ email: 'user1@example.com' })).resolves.toEqual({
        accessToken: 'signed.jwt.token',
        expiresIn: 3600,
      });
      expect(issueTokenByEmail).toHaveBeenCalledWith('user1@example.com');
    });
  });
});
