import request from 'supertest';

import { server } from './setup/bootstrap.app';

const webLog = {
  actions: [{ ctx: 'login', level: 'error', message: 'failed', payload: {} }],
  env: 'test',
  metadata: {
    browser: 'Chrome',
    browserVersion: '148.0.0.0',
    devicePixelRatio: 2,
    fullUrl: 'http://localhost:5173/login',
    language: 'en-US',
    mobile: false,
    os: 'macOS',
    screen: '1728x1117',
    timezone: 'UTC',
    url: '/login',
    viewport: '1046x920',
  },
  timestamp: '2026-05-18T00:00:00.000Z',
  traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
};

describe('Client logs API (e2e)', () => {
  describe('POST /api/v1/client-logs/web', () => {
    describe('negative cases', () => {
      it('rejects an oversize stack with 422', async () => {
        const body = { ...webLog, actions: [{ ...webLog.actions[0], stack: 'x'.repeat(10001) }] };

        const res = await request(server).post('/api/v1/client-logs/web').send(body).expect(422);

        expect((res.body as { code: string }).code).toBe('DTO_VALIDATION_ERROR');
      });
    });

    describe('positive cases', () => {
      it('accepts logs from a signed-out page without an Authorization header', async () => {
        await request(server).post('/api/v1/client-logs/web').send(webLog).expect(204);
      });
    });
  });
});
