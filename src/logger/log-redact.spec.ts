import pino from 'pino';

import { logRedact } from './log-redact';

const logAndParse = (payload: Record<string, unknown>): Record<string, unknown> => {
  let output = '';
  const logger = pino({ redact: logRedact }, { write: (chunk: string) => (output += chunk) });

  logger.info(payload);

  return JSON.parse(output) as Record<string, unknown>;
};

describe('logRedact', () => {
  describe('negative cases', () => {
    it('keeps non-sensitive body fields', () => {
      const entry = logAndParse({ req: { body: { title: 'buy milk' } } });

      expect(entry.req).toEqual({ body: { title: 'buy milk' } });
    });
  });

  describe('positive cases', () => {
    it('redacts password, email and token inside req.body', () => {
      const entry = logAndParse({ req: { body: { email: 'a@b.c', password: 'secret', title: 't', token: 'jwt' } } });

      expect(entry.req).toEqual({
        body: { email: '[REDACTED]', password: '[REDACTED]', title: 't', token: '[REDACTED]' },
      });
    });
  });
});
