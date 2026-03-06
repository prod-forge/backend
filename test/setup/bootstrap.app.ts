import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';

import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/app.setup';

let app: INestApplication<App>;
let server: App;

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = moduleFixture.createNestApplication<NestExpressApplication>();

  appSetup(app);

  server = app.getHttpServer();
  await app.init();
});

afterAll(async () => {
  await app.close();
});

export { app, server };
