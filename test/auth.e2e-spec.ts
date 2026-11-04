import request from 'supertest';

import { server } from './setup/bootstrap.app';
import { type DataBody, type ErrorBody, type ListBody, type TodoItem } from './utils/response.types';

const LOGIN_URL = '/api/v1/auth/login';
const TODOS_URL = '/api/v1/todos';
const SEEDED_EMAIL = 'user4@example.com';

type TokenBody = DataBody<{ accessToken: string; expiresIn: number }>;

describe('Auth API (e2e)', () => {
  describe('negative cases', () => {
    it('returns 401 for an unknown email', async () => {
      const res = await request(server).post(LOGIN_URL).send({ email: 'nobody@example.com' });

      expect(res.status).toBe(401);
      expect((res.body as ErrorBody).status).toBe(401);
    });

    it('returns 422 for a malformed email', async () => {
      const res = await request(server).post(LOGIN_URL).send({ email: 'not-an-email' });

      expect(res.status).toBe(422);
    });

    it('returns 401 for a tampered token', async () => {
      const login = await request(server).post(LOGIN_URL).send({ email: SEEDED_EMAIL });
      const { accessToken } = (login.body as TokenBody).data;

      const res = await request(server).get(TODOS_URL).set('Authorization', `Bearer ${accessToken}x`);

      expect(res.status).toBe(401);
    });
  });

  describe('positive cases', () => {
    it('issues an access token that works on a protected route', async () => {
      const login = await request(server).post(LOGIN_URL).send({ email: SEEDED_EMAIL });

      expect(login.status).toBe(200);
      const { accessToken, expiresIn } = (login.body as TokenBody).data;
      expect(accessToken).toEqual(expect.any(String));
      expect(expiresIn).toBeGreaterThan(0);

      const res = await request(server).get(TODOS_URL).set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect((res.body as ListBody<TodoItem>).data).toEqual(expect.any(Array));
    });
  });
});
