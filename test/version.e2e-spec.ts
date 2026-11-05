import request from 'supertest';

import { server } from './setup/bootstrap.app';

describe('Version API (e2e)', () => {
  describe('GET /api/version', () => {
    describe('negative cases', () => {
      it('is not served without the API prefix', async () => {
        await request(server).get('/version').expect(404);
      });
    });

    describe('positive cases', () => {
      it('returns 200 with a version field', async () => {
        const res = await request(server).get('/api/version').expect(200);
        const body = res.body as { data: { version: string } };

        expect(body.data).toHaveProperty('version');
      });

      it('version is a non-empty string', async () => {
        const res = await request(server).get('/api/version').expect(200);
        const body = res.body as { data: { version: string } };

        expect(typeof body.data.version).toBe('string');
        expect(body.data.version.length).toBeGreaterThan(0);
      });
    });
  });
});
