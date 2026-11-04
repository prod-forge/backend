import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { RequestTrackingService } from './request-tracking.service';

@Injectable()
export class RequestTrackingMiddleware implements NestMiddleware {
  constructor(private readonly tracker: RequestTrackingService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    this.tracker.increment();

    let done = false;
    const release = (): void => {
      if (done) {
        return;
      }
      done = true;
      this.tracker.decrement();
    };

    res.on('finish', release);
    res.on('close', release);

    next();
  }
}
