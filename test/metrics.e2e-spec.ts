import request from 'supertest';

import { server } from './setup/bootstrap.app';

const FORWARDED_FOR = '203.0.113.7';

describe('Metrics API (e2e)', () => {
  describe('negative cases', () => {
    it.each(['/metrics', '/METRICS', '/Metrics/', '/metrics/database', '/METRICS/DATABASE', '/api/metrics/database'])(
      'returns 404 for %s when the request came through the load balancer',
      async (path) => {
        await request(server).get(path).set('X-Forwarded-For', FORWARDED_FOR).expect(404);
      },
    );

    it('does not serve the database metrics under the API prefix', async () => {
      await request(server).get('/api/metrics/database').expect(404);
    });
  });

  describe('positive cases', () => {
    it('serves the Prometheus scrape to a direct caller', async () => {
      const res = await request(server).get('/metrics').expect(200);

      expect(res.text).toContain('http_requests_total');
    });

    it('serves the database metrics as a bare JSON array at the root', async () => {
      const res = await request(server).get('/metrics/database').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('does not gate API routes for requests that came through the load balancer', async () => {
      await request(server).get('/api/version').set('X-Forwarded-For', FORWARDED_FOR).expect(200);
    });
  });
});
