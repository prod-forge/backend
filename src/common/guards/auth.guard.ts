import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { UserIsNotAuthorizedError } from '../../error-handler/errors/user.errors';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request & { userId?: string }>();

    const auth = req.header('Authorization');
    if (!auth) throw new UserIsNotAuthorizedError();

    const [prefix, token] = auth.split(' ');
    if (prefix !== 'Bearer') throw new UserIsNotAuthorizedError();

    req.userId = Buffer.from(token, 'base64').toString('ascii');

    return true;
  }
}
