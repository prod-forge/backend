import type { App } from 'supertest/types';

import { Body, Controller, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import pino from 'pino';
import request from 'supertest';

import type { LogConfigInterface } from '../../config/interfaces/log-config.interface';
import type { LoggerService } from '../logger.service';

import { logRedact } from '../log-redact';
import { useRequestLogging } from './request-logging.setup';

@Controller('echo')
class EchoController {
  @Post()
  echo(@Body() body: Record<string, unknown>): Record<string, unknown> {
    return body;
  }
}

const setup = async (): Promise<{ entries: Record<string, unknown>[]; post: (body: object) => request.Test }> => {
  const entries: Record<string, unknown>[] = [];
  const pinoLogger = pino(
    { level: 'debug', redact: logRedact },
    { write: (chunk: string) => entries.push(JSON.parse(chunk) as Record<string, unknown>) },
  );
  const logger = {
    debug: (message: object): void => pinoLogger.debug(message),
    log: (message: object): void => pinoLogger.info(message),
  } as unknown as LoggerService;
  const module = await Test.createTestingModule({ controllers: [EchoController] }).compile();
  const app = module.createNestApplication();

  useRequestLogging(app, { logExcludeEndpoints: [] } as unknown as LogConfigInterface, logger);
  await app.init();

  const server = app.getHttpServer() as App;

  return { entries, post: (body) => request(server).post('/echo').send(body) };
};

describe('useRequestLogging', () => {
  describe('negative cases', () => {
    it('does not leak the password into any log entry', async () => {
      const { entries, post } = await setup();

      await post({ email: 'a@b.c', password: 'hunter2' });

      expect(JSON.stringify(entries)).not.toMatch(/hunter2|a@b\.c/);
    });
  });

  describe('positive cases', () => {
    it('parses the body before logging and redacts it in the debug entry', async () => {
      const { entries, post } = await setup();

      const res = await post({ password: 'hunter2', title: 't' });
      const debugEntry = entries.find((e) => e.level === 20 && e.req);

      expect(res.body).toEqual({ password: 'hunter2', title: 't' });
      expect(debugEntry?.req).toEqual({ body: { password: '[REDACTED]', title: 't' } });
    });
  });
});
