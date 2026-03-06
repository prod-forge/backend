import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

import { UserIsNotAuthorizedError } from '../../error-handler/errors/user.errors';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { userId?: string }>();

    const auth = req.header('Authorization');
    if (!auth) throw new UserIsNotAuthorizedError();

    const [prefix, token] = auth.split(' ');
    if (prefix !== 'Bearer') throw new UserIsNotAuthorizedError();

    req.userId = Buffer.from(token, 'base64').toString('ascii');

    return true;
  }
}
