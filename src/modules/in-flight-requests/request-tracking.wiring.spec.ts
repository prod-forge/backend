import type { NextFunction, Request, Response } from 'express';

import { Global, Module } from '@nestjs/common';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { EventEmitter } from 'node:events';

import { AppModule } from '../../app.module';
import { appConfig } from '../../config/app.config';
import { LoggerService } from '../../logger/logger.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { RedisManagerModule } from '../redis-manager/redis-manager.module';
import { RedisManagerService } from '../redis-manager/redis-manager.service';
import { ShutdownModule } from '../shutdown/shutdown.module';
import { ShutdownService } from '../shutdown/shutdown.service';
import { RequestTrackingMiddleware } from './request-tracking.middleware';
import { RequestTrackingModule } from './request-tracking.module';
import { RequestTrackingService } from './request-tracking.service';

const logger = { error: jest.fn(), log: jest.fn() };

@Global()
@Module({
  exports: [LoggerService, appConfig.KEY],
  providers: [
    { provide: LoggerService, useValue: logger },
    { provide: appConfig.KEY, useValue: { shutdownDrainMs: 0, shutdownInflightTimeoutMs: 1000 } },
  ],
})
class CoreStubModule {}

@Module({ exports: [PrismaService], providers: [{ provide: PrismaService, useValue: {} }] })
class PrismaStubModule {}

@Module({ exports: [RedisManagerService], providers: [{ provide: RedisManagerService, useValue: {} }] })
class RedisStubModule {}

// Mirrors AppModule: the middleware is instantiated in the root module, ShutdownService in ShutdownModule
const compileAppLikeModule = async (): Promise<{
  middleware: RequestTrackingMiddleware;
  shutdown: ShutdownService;
}> => {
  const module = await Test.createTestingModule({
    imports: [CoreStubModule, RequestTrackingModule, ShutdownModule],
    providers: [RequestTrackingMiddleware],
  })
    .overrideModule(PrismaModule)
    .useModule(PrismaStubModule)
    .overrideModule(RedisManagerModule)
    .useModule(RedisStubModule)
    .compile();

  return { middleware: module.get(RequestTrackingMiddleware), shutdown: module.get(ShutdownService) };
};

describe('RequestTrackingService wiring', () => {
  describe('negative cases', () => {
    it('AppModule does not declare its own RequestTrackingService provider', () => {
      const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AppModule) as unknown[];

      expect(providers).not.toContain(RequestTrackingService);
    });
  });

  describe('positive cases', () => {
    it('AppModule imports RequestTrackingModule, the module ShutdownModule takes the tracker from', () => {
      const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule) as unknown[];

      expect(imports).toContain(RequestTrackingModule);
    });

    it('ShutdownService waits for a request counted by the middleware', async () => {
      const { middleware, shutdown } = await compileAppLikeModule();
      const res = new EventEmitter();

      middleware.use({} as Request, res as unknown as Response, jest.fn() as NextFunction);
      setTimeout(() => res.emit('finish'), 50);
      await shutdown.beforeApplicationShutdown('SIGTERM');

      expect(logger.log).toHaveBeenCalledWith(
        expect.objectContaining({ msg: expect.stringContaining('in-flight requests') as unknown }),
      );
    });
  });
});
