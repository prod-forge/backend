import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { App } from 'supertest/types';

import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { appSetup } from '../src/app.setup';

const TODOS_URL = '/api/v1/todos';
const THROTTLE_LIMIT = 3;
// Seeded users no other e2e file authenticates as, so their buckets stay untouched.
const THROTTLED_USER_ID = 'f870a1dd-3814-42e9-8175-99cd507873ab';
const SECOND_USER_ID = '535645c4-0409-4ac3-b78c-1f7b9581873b';

const issueToken = (userId: string): string =>
  new JwtService({
    secret: process.env.JWT_SECRET,
    signOptions: { algorithm: 'HS256', expiresIn: 3600 },
  }).sign({}, { subject: userId });

describe('Throttling (e2e)', () => {
  const originalEnv = { ...process.env };
  let app: INestApplication<App>;
  let server: App;

  const getTodos = (token: string): request.Test =>
    request(server).get(TODOS_URL).set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    process.env.THROTTLE_LIMIT = String(THROTTLE_LIMIT);
    process.env.THROTTLE_TTL = '60000';
    process.env.THROTTLE_ENABLED = 'true';

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
      const token = issueToken(THROTTLED_USER_ID);

      for (let i = 0; i < THROTTLE_LIMIT; i++) {
        await getTodos(token).expect(200);
      }

      const res = await getTodos(token);

      expect(res.status).toBe(429);
      expect(res.headers['retry-after']).toBeDefined();
    });

    it('never throttles /health', async () => {
      for (let i = 0; i < 10; i++) {
        await request(server).get('/health').expect(200);
      }
    });

    it('never throttles /metrics', async () => {
      for (let i = 0; i < 10; i++) {
        await request(server).get('/metrics').expect(200);
      }
    });
  });

  describe('positive cases', () => {
    it('counts each user separately even when they share an IP', async () => {
      const token = issueToken(SECOND_USER_ID);

      for (let i = 0; i < THROTTLE_LIMIT; i++) {
        await getTodos(token).expect(200);
      }
    });
  });
});
