import type { AuthService } from '../../modules/auth/auth.service';
import type { UsersRepository } from './users.repository';

import { UserIsNotAuthorizedError } from '../../error-handler/errors/user.errors';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const findByEmail = jest.fn();
  const issueToken = jest.fn();
  const service = new UsersService(
    { findByEmail } as unknown as UsersRepository,
    {
      issueToken,
    } as unknown as AuthService,
  );

  beforeEach(() => jest.clearAllMocks());

  describe('negative cases', () => {
    it('throws when the email is unknown', async () => {
      findByEmail.mockResolvedValue(undefined);

      await expect(service.issueTokenByEmail('nobody@example.com')).rejects.toThrow(UserIsNotAuthorizedError);
      expect(issueToken).not.toHaveBeenCalled();
    });
  });

  describe('positive cases', () => {
    it('issues a token for the user with the given email', async () => {
      findByEmail.mockResolvedValue({ email: 'user1@example.com', id: 'u1' });
      issueToken.mockResolvedValue('signed.jwt.token');

      await expect(service.issueTokenByEmail('user1@example.com')).resolves.toBe('signed.jwt.token');
      expect(issueToken).toHaveBeenCalledWith('u1');
    });
  });
});
