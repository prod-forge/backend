import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { UserInterface } from '../../shared/interfaces/user.interface';

export const User = (): ParameterDecorator =>
  createParamDecorator((_: unknown, ctx: ExecutionContext): UserInterface => {
    const request: Request & { userId: string } = ctx.switchToHttp().getRequest();

    return { userId: request.userId };
  })();
