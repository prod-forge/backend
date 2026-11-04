import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';

import { Controller, Get } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { MetricsController } from '../../../api/metrics/metrics.controller';
import { GLOBAL_PREFIX_EXCLUDE, METRICS_ENDPOINT } from '../../../constants/url.constants';
import { MetricsService } from '../metrics.service';
import { metricsGateMiddleware } from './metrics-gate.middleware';

@Controller(METRICS_ENDPOINT)
class ScrapeStubController {
  @Get()
  index(): string {
    return 'scrape';
  }
}

const setup = async (): Promise<{ app: INestApplication; server: App }> => {
  const module = await Test.createTestingModule({
    controllers: [ScrapeStubController, MetricsController],
    providers: [{ provide: MetricsService, useValue: { getDatabaseMetrics: jest.fn().mockResolvedValue([]) } }],
  }).compile();
  const app = module.createNestApplication();

  app.use(metricsGateMiddleware);
  app.setGlobalPrefix('api', { exclude: GLOBAL_PREFIX_EXCLUDE });
  await app.init();

  return { app, server: app.getHttpServer() as App };
};

describe('metricsGateMiddleware', () => {
  let app: INestApplication;
  let server: App;

  beforeAll(async () => {
    ({ app, server } = await setup());
  });

  afterAll(async () => {
    await app.close();
  });

  describe('negative cases', () => {
    it.each(['/metrics', '/METRICS', '/Metrics/', '/metrics/database', '/METRICS/Database', '/api/metrics/database'])(
      'returns 404 for %s when the request came through the load balancer',
      async (path) => {
        await request(server).get(path).set('X-Forwarded-For', '203.0.113.7').expect(404);
      },
    );

    it('no longer serves the JSON endpoint under the API prefix', async () => {
      await request(server).get('/api/metrics/database').expect(404);
    });
  });

  describe('positive cases', () => {
    it('serves the scrape endpoint to a direct caller', async () => {
      const res = await request(server).get('/metrics').expect(200);

      expect(res.text).toBe('scrape');
    });

    it('serves the scrape endpoint case-insensitively to a direct caller', async () => {
      await request(server).get('/METRICS').expect(200);
    });

    it('serves the database metrics at the root to a direct caller', async () => {
      const res = await request(server).get('/metrics/database').expect(200);

      expect(res.body).toEqual([]);
    });
  });
});
