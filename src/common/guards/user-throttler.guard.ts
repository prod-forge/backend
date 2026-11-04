import type { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';

import { Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectThrottlerOptions, InjectThrottlerStorage, ThrottlerGuard } from '@nestjs/throttler';

import { AuthService } from '../../modules/auth/auth.service';

type TrackedRequest = {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  userId?: string;
};

/**
 * The global throttler runs before the route-level AuthGuard, so `req.userId` is usually not set yet.
 * The tracker therefore verifies the Bearer token itself and falls back to the client IP on any failure.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    @Inject(AuthService) private readonly authService: AuthService,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: TrackedRequest): Promise<string> {
    const userId = req.userId ?? (await this.resolveUserId(req));

    return userId ? `user:${userId}` : `ip:${req.ip}`;
  }

  private async resolveUserId(req: TrackedRequest): Promise<string | undefined> {
    const header = req.headers.authorization;
    if (typeof header !== 'string') return undefined;

    const [prefix, token] = header.split(' ');
    if (prefix !== 'Bearer' || !token) return undefined;

    try {
      const { userId } = await this.authService.verifyToken(token);

      return userId;
    } catch {
      return undefined;
    }
  }
}
