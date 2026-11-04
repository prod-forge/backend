import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { UserIsNotAuthorizedError } from '../../error-handler/errors/user.errors';
import { AuthService } from '../../modules/auth/auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request & { userId?: string }>();

    const auth = req.header('Authorization');
    if (!auth) throw new UserIsNotAuthorizedError();

    const [prefix, token] = auth.split(' ');
    if (prefix !== 'Bearer' || !token) throw new UserIsNotAuthorizedError();

    const { userId } = await this.authService.verifyToken(token);
    req.userId = userId;

    return true;
  }
}
