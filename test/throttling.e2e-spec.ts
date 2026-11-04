import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { App } from 'supertest/types';

import { Test } from '@nestjs/testing';
import request from 'supertest';

import type * as AppModuleExports from '../src/app.module';
import type * as AppSetupExports from '../src/app.setup';

import { type DataBody } from './utils/response.types';

const LOGIN_URL = '/api/v1/auth/login';
const TODOS_URL = '/api/v1/todos';
const THROTTLE_LIMIT = 3;

type TokenBody = DataBody<{ accessToken: string }>;

describe('Throttling (e2e)', () => {
  const originalEnv = { ...process.env };
  let app: INestApplication<App>;
  let server: App;

  const login = async (email: string): Promise<string> => {
    const res = await request(server).post(LOGIN_URL).send({ email });

    return (res.body as TokenBody).data.accessToken;
  };

  beforeAll(async () => {
    process.env.THROTTLE_LIMIT = String(THROTTLE_LIMIT);
    process.env.THROTTLE_TTL = '60000';
    process.env.THROTTLE_ENABLED = 'true';

    // Config factories read process.env at import time, so load a fresh AppModule with the low limits.
    jest.resetModules();
    const { AppModule } = jest.requireActual<typeof AppModuleExports>('../src/app.module');
    const { appSetup } = jest.requireActual<typeof AppSetupExports>('../src/app.setup');

    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication<NestExpressApplication>();
    appSetup(app);
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    process.env = originalEnv;
  });

  describe('negative cases', () => {
    it('returns 429 with Retry-After on the request over the limit', async () => {
      const token = await login('user1@example.com');

      for (let i = 0; i < THROTTLE_LIMIT; i++) {
        await request(server).get(TODOS_URL).set('Authorization', `Bearer ${token}`).expect(200);
      }

      const res = await request(server).get(TODOS_URL).set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(429);
      expect(res.headers['retry-after']).toBeDefined();
    });
  });

  describe('positive cases', () => {
    it('counts each user separately even when they share an IP', async () => {
      const token = await login('user2@example.com');

      for (let i = 0; i < THROTTLE_LIMIT; i++) {
        await request(server).get(TODOS_URL).set('Authorization', `Bearer ${token}`).expect(200);
      }
    });

    it('never throttles /health', async () => {
      for (let i = 0; i < 10; i++) {
        await request(server).get('/health').expect(200);
      }
    });
  });
});
