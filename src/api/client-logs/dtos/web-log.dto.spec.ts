import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { WebLogLevel } from './web-log-action.dto';
import { WebLogDto } from './web-log.dto';

const makeDto = (action: Record<string, unknown> = {}): WebLogDto =>
  plainToInstance(WebLogDto, {
    actions: [{ ctx: 'app', level: WebLogLevel.ERROR, message: 'boom', payload: {}, ...action }],
    env: 'test',
    metadata: {
      browser: 'Chrome',
      browserVersion: '148.0.0.0',
      devicePixelRatio: 2,
      fullUrl: 'http://localhost:5173/',
      language: 'en-US',
      mobile: false,
      os: 'macOS',
      screen: '1728x1117',
      timezone: 'UTC',
      url: '/',
      viewport: '1046x920',
    },
    timestamp: '2026-05-18T00:00:00.000Z',
    traceId: '9c226319-abcc-4d6c-a1b6-f5d1cf18b6ae',
  });

describe('WebLogDto', () => {
  describe('negative cases', () => {
    it('rejects an oversize stack', async () => {
      const errors = await validate(makeDto({ stack: 'x'.repeat(10001) }));

      expect(errors).not.toHaveLength(0);
    });

    it('rejects an oversize message', async () => {
      const errors = await validate(makeDto({ message: 'x'.repeat(2001) }));

      expect(errors).not.toHaveLength(0);
    });
  });

  describe('positive cases', () => {
    it('accepts a stack within the limit', async () => {
      const errors = await validate(makeDto({ stack: 'x'.repeat(10000) }));

      expect(errors).toHaveLength(0);
    });

    it('accepts an action without a stack', async () => {
      expect(await validate(makeDto())).toHaveLength(0);
    });
  });
});
