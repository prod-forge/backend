import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserIsNotAuthorizedError } from '../../error-handler/errors/user.errors';

@Injectable()
export class AuthService {
  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  issueToken(userId: string): Promise<string> {
    return this.jwtService.signAsync({}, { subject: userId });
  }

  async verifyToken(token: string): Promise<{ userId: string }> {
    try {
      const { sub } = await this.jwtService.verifyAsync<{ sub?: string }>(token, { algorithms: ['HS256'] });

      if (!sub) throw new UserIsNotAuthorizedError();

      return { userId: sub };
    } catch {
      throw new UserIsNotAuthorizedError();
    }
  }
}
