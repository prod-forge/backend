import { Module } from '@nestjs/common';

import { RequestTrackingService } from './request-tracking.service';

@Module({
  exports: [RequestTrackingService],
  imports: [],
  providers: [RequestTrackingService],
})
export class RequestTrackingModule {}
