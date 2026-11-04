import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

import { UserIsNotAuthorizedError } from '../../error-handler/errors/user.errors';
import { AuthService } from './auth.service';

const SECRET = 't'.repeat(32);

const createService = async (ttl: number): Promise<{ jwtService: JwtService; service: AuthService }> => {
  const module = await Test.createTestingModule({
    imports: [JwtModule.register({ secret: SECRET, signOptions: { algorithm: 'HS256', expiresIn: ttl } })],
    providers: [AuthService],
  }).compile();

  return { jwtService: module.get(JwtService), service: module.get(AuthService) };
};

describe('AuthService', () => {
  describe('negative cases', () => {
    it('throws when the signature is tampered', async () => {
      const { service } = await createService(3600);
      const token = await service.issueToken('u1');
      const [header, payload] = token.split('.');

      await expect(service.verifyToken(`${header}.${payload}.invalidsignature`)).rejects.toThrow(
        UserIsNotAuthorizedError,
      );
    });

    it('throws when the token is expired', async () => {
      const { service } = await createService(-1);
      const token = await service.issueToken('u1');

      await expect(service.verifyToken(token)).rejects.toThrow(UserIsNotAuthorizedError);
    });

    it('throws when the token has no sub claim', async () => {
      const { jwtService, service } = await createService(3600);
      const token = await jwtService.signAsync({});

      await expect(service.verifyToken(token)).rejects.toThrow(UserIsNotAuthorizedError);
    });

    it('throws when the token is not a JWT', async () => {
      const { service } = await createService(3600);

      await expect(service.verifyToken('garbage')).rejects.toThrow(UserIsNotAuthorizedError);
    });
  });

  describe('positive cases', () => {
    it('returns the user id from an issued token', async () => {
      const { service } = await createService(3600);
      const token = await service.issueToken('u1');

      await expect(service.verifyToken(token)).resolves.toEqual({ userId: 'u1' });
    });
  });
});
