import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';

import { ShutdownService } from './shutdown.servie';

@Injectable()
export class ShutdownHealthService {
  constructor(
    private readonly shutdownService: ShutdownService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  check(key: string): HealthIndicatorResult {
    const indicator = this.healthIndicatorService.check(key);

    if (this.shutdownService.isShuttingDown()) {
      return indicator.down({ message: 'Shutting down' });
    }

    return indicator.up();
  }
}
