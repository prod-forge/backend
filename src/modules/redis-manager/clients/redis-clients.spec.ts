import type { EnvironmentService } from '../../environment/environment.service';

import { EnvironmentType } from '../../../config/enums/environment.enum';

jest.mock('ioredis', () => {
  const MockRedis = jest.fn().mockImplementation(() => {
    const handlers: Partial<Record<string, ((...args: unknown[]) => void)[]>> = {};

    return {
      _emit: (event: string, ...args: unknown[]): void => {
        handlers[event]?.forEach((h) => h(...args));
      },
      disconnect: jest.fn(),
      on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
        (handlers[event] ??= []).push(handler);
      }),
      quit: jest.fn().mockResolvedValue('OK'),
    };
  });

  return { __esModule: true, default: MockRedis };
});

import Redis from 'ioredis';

import type { LoggerService } from '../../../logger/logger.service';

import { BaseRedisService } from './_base.client';

const makeConfig = (): { redisHost: string; redisPort: number } => ({ redisHost: 'localhost', redisPort: 6379 });

const makeEnvironment = (env: EnvironmentType): EnvironmentService =>
  ({
    isTest: jest.fn().mockReturnValue(env === EnvironmentType.test),
  }) as unknown as EnvironmentService;

const makeLogger = (): { error: jest.Mock; log: jest.Mock; warn: jest.Mock } => ({
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
});

class TestRedisService extends BaseRedisService {
  constructor(
    config: ReturnType<typeof makeConfig>,
    env: EnvironmentService,
    logger: { error: jest.Mock; log: jest.Mock; warn: jest.Mock },
  ) {
    super(config as never, env, logger as unknown as LoggerService);
    this.client = new Redis(this.getDefaultProps());
  }

  attachListeners(clientName: string): void {
    this.client.on('connect', () => this.logger.log({ ctx: clientName, msg: `${clientName} connected` }));
    this.client.on('close', () => this.logger.warn({ ctx: clientName, msg: `${clientName} disconnected` }));
    this.client.on('error', (err) => this.logger.error({ ctx: clientName, details: err, msg: `${clientName} error` }));
  }
}

describe('BaseRedisService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('positive cases', () => {
    it('getClient returns the redis client', () => {
      const service = new TestRedisService(makeConfig(), makeEnvironment(EnvironmentType.test), makeLogger());

      expect(service.getClient()).toBeDefined();
    });

    it('getDefaultProps in test env returns null from retryStrategy', () => {
      const service = new TestRedisService(makeConfig(), makeEnvironment(EnvironmentType.test), makeLogger());
      const props = service.getDefaultProps();

      const result = (props.retryStrategy as (times: number) => null)(1);

      expect(result).toBeNull();
    });

    it('getDefaultProps in production returns retry delay for first attempts', () => {
      const service = new TestRedisService(makeConfig(), makeEnvironment(EnvironmentType.production), makeLogger());
      const retryFn = service.getDefaultProps().retryStrategy as (times: number) => null | number;

      expect(retryFn(1)).toBe(200);
      expect(retryFn(2)).toBe(400);
    });

    it('getDefaultProps in production returns null after MAX_RETRIES', () => {
      const service = new TestRedisService(makeConfig(), makeEnvironment(EnvironmentType.production), makeLogger());
      const retryFn = service.getDefaultProps().retryStrategy as (times: number) => null | number;

      expect(retryFn(10)).toBeNull();
    });

    it('getDefaultProps sets correct host and port from config', () => {
      const service = new TestRedisService(makeConfig(), makeEnvironment(EnvironmentType.test), makeLogger());
      const props = service.getDefaultProps();

      expect(props.host).toBe('localhost');
      expect(props.port).toBe(6379);
    });

    it('attachListeners logs connect event', () => {
      const logger = makeLogger();
      const service = new TestRedisService(makeConfig(), makeEnvironment(EnvironmentType.test), logger);
      service.attachListeners('TestClient');

      (service.getClient() as unknown as { _emit: (e: string) => void })._emit('connect');

      expect(logger.log).toHaveBeenCalledWith(expect.objectContaining({ msg: 'TestClient connected' }));
    });

    it('attachListeners logs close event', () => {
      const logger = makeLogger();
      const service = new TestRedisService(makeConfig(), makeEnvironment(EnvironmentType.test), logger);
      service.attachListeners('TestClient');

      (service.getClient() as unknown as { _emit: (e: string) => void })._emit('close');

      expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ msg: 'TestClient disconnected' }));
    });

    it('attachListeners logs error event', () => {
      const logger = makeLogger();
      const service = new TestRedisService(makeConfig(), makeEnvironment(EnvironmentType.test), logger);
      service.attachListeners('TestClient');

      const err = new Error('connection refused');
      (service.getClient() as unknown as { _emit: (e: string, err: Error) => void })._emit('error', err);

      expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ details: err }));
    });
  });
});
