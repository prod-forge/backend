import { Injectable } from '@nestjs/common';

@Injectable()
export class RequestTrackingService {
  private activeRequests = 0;

  decrement(): void {
    this.activeRequests--;
  }

  getActiveRequests(): number {
    return this.activeRequests;
  }

  increment(): void {
    this.activeRequests++;
  }

  async waitForRequestsToFinish(timeout = 30000): Promise<void> {
    const start = Date.now();

    while (this.activeRequests > 0) {
      if (Date.now() - start > timeout) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}
