import { Module } from '@nestjs/common';

import { LoggerModule } from '../../logger/logger.module';
import { EnvironmentModule } from '../environment/environment.module';
import { CacheRedis } from './clients/cache.client';
import { ThrottlerRedis } from './clients/throttler.client';
import { REDIS_CACHE, REDIS_THROTTLER } from './di/di.types';
import { RedisOptionsInterface } from './interfaces/redis-options.interface';
import { RedisHealthService } from './redis-health.service';
import { RedisManagerService } from './redis-manager.service';
import { CacheStorage } from './storages/cache.storage';

@Module({
  exports: [RedisManagerService, RedisHealthService, CacheStorage],
  imports: [EnvironmentModule, LoggerModule],
  providers: [
    {
      provide: REDIS_THROTTLER,
      useFactory: (): RedisOptionsInterface => ({
        db: 0,
        keyPrefix: 'throttler:',
      }),
    },
    {
      provide: REDIS_CACHE,
      useFactory: (): RedisOptionsInterface => ({
        db: 1,
        keyPrefix: 'cache:',
      }),
    },
    RedisManagerService,
    ThrottlerRedis,
    CacheRedis,
    RedisHealthService,
    CacheStorage,
  ],
})
export class RedisManagerModule {}
