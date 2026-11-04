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

type TestConfig = { redisHost: string; redisPassword?: string; redisPort: number; redisTls?: boolean };

const makeConfig = (): TestConfig => ({ redisHost: 'localhost', redisPort: 6379 });

const makeEnvironment = (env: EnvironmentType): EnvironmentService =>
  ({
    isProduction: jest.fn().mockReturnValue(env === EnvironmentType.production),
    isTest: jest.fn().mockReturnValue(env === EnvironmentType.test),
  }) as unknown as EnvironmentService;

const makeLogger = (): { error: jest.Mock; log: jest.Mock; warn: jest.Mock } => ({
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
});

class TestRedisService extends BaseRedisService {
  constructor(
    config: TestConfig,
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

    it('getDefaultProps in production backs off exponentially up to the cap and never gives up', () => {
      const service = new TestRedisService(makeConfig(), makeEnvironment(EnvironmentType.production), makeLogger());
      const retryFn = service.getDefaultProps().retryStrategy as (times: number) => null | number;

      expect(retryFn(1)).toBe(200);
      expect(retryFn(2)).toBe(400);
      expect(retryFn(25)).toBe(5000);
      expect(retryFn(10_000)).toBe(5000);
    });

    it('retryStrategy warns on the first attempt and every 10th only', () => {
      const logger = makeLogger();
      const service = new TestRedisService(makeConfig(), makeEnvironment(EnvironmentType.production), logger);
      const retryFn = service.getDefaultProps().retryStrategy as (times: number) => null | number;

      for (let i = 1; i <= 20; i++) retryFn(i);

      expect(logger.warn).toHaveBeenCalledTimes(3);
    });

    it('getDefaultProps keeps requests failing fast while disconnected', () => {
      const service = new TestRedisService(makeConfig(), makeEnvironment(EnvironmentType.production), makeLogger());
      const props = service.getDefaultProps();

      expect(props.maxRetriesPerRequest).toBe(0);
      expect(props.enableOfflineQueue).toBe(false);
    });

    it('getDefaultProps omits tls and password by default', () => {
      const service = new TestRedisService(makeConfig(), makeEnvironment(EnvironmentType.test), makeLogger());
      const props = service.getDefaultProps();

      expect(props).not.toHaveProperty('tls');
      expect(props).not.toHaveProperty('password');
    });

    it('getDefaultProps passes tls with default verification and password when set', () => {
      const config = { ...makeConfig(), redisPassword: 'secret', redisTls: true };
      const service = new TestRedisService(config, makeEnvironment(EnvironmentType.production), makeLogger());
      const props = service.getDefaultProps();

      expect(props.tls).toEqual({});
      expect(props.password).toBe('secret');
    });

    it('getDefaultProps warns when tls is on in production without a password', () => {
      const logger = makeLogger();
      const config = { ...makeConfig(), redisTls: true };
      const service = new TestRedisService(config, makeEnvironment(EnvironmentType.production), logger);
      service.getDefaultProps();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ msg: 'REDIS_TLS is enabled in production without REDIS_PASSWORD' }),
      );
    });

    it('getDefaultProps does not warn about tls without a password outside production', () => {
      const logger = makeLogger();
      const config = { ...makeConfig(), redisTls: true };
      const service = new TestRedisService(config, makeEnvironment(EnvironmentType.development), logger);
      service.getDefaultProps();

      expect(logger.warn).not.toHaveBeenCalled();
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
