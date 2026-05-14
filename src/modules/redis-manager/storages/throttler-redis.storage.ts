import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Injectable } from '@nestjs/common';

import { ThrottlerRedis } from '../clients/throttler.client';

@Injectable()
export class ThrottlerRedisStorage extends ThrottlerStorageRedisService {
  constructor(throttlerRedis: ThrottlerRedis) {
    super(throttlerRedis.getClient());
  }
}
