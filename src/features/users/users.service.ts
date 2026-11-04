import { Injectable } from '@nestjs/common';

import { UserIsNotAuthorizedError } from '../../error-handler/errors/user.errors';
import { AuthService } from '../../modules/auth/auth.service';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authService: AuthService,
  ) {}

  async issueTokenByEmail(email: string): Promise<string> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) throw new UserIsNotAuthorizedError();

    return this.authService.issueToken(user.id);
  }
}
