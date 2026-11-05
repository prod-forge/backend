import request from 'supertest';

import { server } from './setup/bootstrap.app';

describe('Health API (e2e)', () => {
  describe('GET /health', () => {
    describe('negative cases', () => {
      it('is not served under the API prefix', async () => {
        await request(server).get('/api/health').expect(404);
      });
    });

    describe('positive cases', () => {
      it('returns 200 with a status field', async () => {
        const res = await request(server).get('/health').expect(200);

        expect(res.body).toHaveProperty('status');
      });

      it('reports status as "ok"', async () => {
        const res = await request(server).get('/health').expect(200);
        const body = res.body as { status: string };

        expect(body.status).toBe('ok');
      });
    });
  });

  describe('GET /health/deps', () => {
    describe('negative cases', () => {
      it('answers POST with 404', async () => {
        await request(server).post('/health/deps').expect(404);
      });
    });

    describe('positive cases', () => {
      it('returns 200 with a status field', async () => {
        const res = await request(server).get('/health/deps').expect(200);

        expect(res.body).toHaveProperty('status');
      });

      it('includes info about each dependency', async () => {
        const res = await request(server).get('/health/deps').expect(200);

        expect(res.body).toHaveProperty('info');
      });
    });
  });

  describe('GET /health/live', () => {
    describe('negative cases', () => {
      it('answers POST with 404', async () => {
        await request(server).post('/health/live').expect(404);
      });
    });

    describe('positive cases', () => {
      it('returns the bare liveness body without dependency checks', async () => {
        const res = await request(server).get('/health/live').expect(200);

        expect(res.body).toEqual({ status: 'ok' });
      });
    });
  });
});
