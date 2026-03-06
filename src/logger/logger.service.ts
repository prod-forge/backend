import type { ConfigType } from '@nestjs/config';

import { Inject, Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import pino, { LogDescriptor, Logger } from 'pino';
import pretty from 'pino-pretty';

import { logConfig } from '../config/log.config';
import { EnvironmentService } from '../modules/environment/environment.service';
import { RequestContext } from './context/request-context';

type Details = unknown;

interface Message {
  code?: string;
  ctx: string;
  details?: Details;
  method?: string;
  msg: string;
  path?: string;
  stack?: string;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  #appName = 'Company App';

  private logger: Logger;

  constructor(
    @Inject(logConfig.KEY)
    private config: ConfigType<typeof logConfig>,
    private readonly environment: EnvironmentService,
  ) {
    const stream = config.logPretty
      ? pretty({
          colorize: true,

          ignore: 'appName,ctx,env,correlationId,levelName',
          messageFormat: (log: LogDescriptor, messageKey: string) => {
            const ctx = log.ctx ? `[${log.ctx}]` : '';
            const level = (log.levelLabel as string) ?? log.level;
            const correlationId = log.correlationId === '' ? '' : `Correlation-ID: ${log.correlationId}`;

            return `${level} ${ctx} ${correlationId} ${log[messageKey]}`;
          },

          translateTime: 'dd/mm/yyyy, HH:MM:ss',
        })
      : undefined;

    this.logger = pino(
      {
        base: {
          env: environment.getEnv(),
        },
        level: config.logLevel,
        redact: {
          censor: '[REDACTED]',
          paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
        },
        timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
      },
      stream,
    );
  }

  debug(message: Message): void {
    this.logger.debug({
      appName: this.#appName,
      correlationId: RequestContext.getCorrelationId(),
      levelName: 'debug',
      pid: process.pid,
      ...(typeof message === 'string' ? { msg: message } : message),
    });
  }

  error(message: Message): void {
    this.logger.error({
      appName: this.#appName,
      correlationId: RequestContext.getCorrelationId(),
      levelName: 'error',
      pid: process.pid,
      ...(typeof message === 'string' ? { msg: message } : message),
    });
  }

  log(message: Message): void {
    this.logger.info({
      appName: this.#appName,
      correlationId: RequestContext.getCorrelationId(),
      levelName: 'info',
      pid: process.pid,
      ...(typeof message === 'string' ? { msg: message } : message),
    });
  }

  public setAppName(name: string): void {
    this.#appName = name;
  }

  warn(message: Message): void {
    this.logger.warn({
      appName: this.#appName,
      correlationId: RequestContext.getCorrelationId(),
      levelName: 'warn',
      pid: process.pid,
      ...(typeof message === 'string' ? { msg: message } : message),
    });
  }
}
