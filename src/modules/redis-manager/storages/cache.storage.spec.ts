import { Test } from '@nestjs/testing';
import { Readable } from 'node:stream';
import { register } from 'prom-client';

import { LoggerService } from '../../../logger/logger.service';
import { RedisManagerService } from '../redis-manager.service';
import { CacheStorage } from './cache.storage';

type RedisMock = {
  del: jest.Mock;
  get: jest.Mock;
  options: { keyPrefix: string };
  scanStream: jest.Mock;
  set: jest.Mock;
  unlink: jest.Mock;
};

const makeRedisMock = (): RedisMock => ({
  del: jest.fn().mockResolvedValue(1),
  get: jest.fn().mockResolvedValue(null),
  options: { keyPrefix: 'cache:' },
  scanStream: jest.fn().mockReturnValue(Readable.from([])),
  set: jest.fn().mockResolvedValue('OK'),
  unlink: jest.fn().mockResolvedValue(1),
});

const failingStream = (): Readable =>
  new Readable({
    read(): void {
      this.destroy(new Error('scan error'));
    },
  });

const counterValue = async (operation: string, result: string): Promise<number> => {
  const metric = await register.getSingleMetric('cache_operations_total')?.get();

  return metric?.values.find((v) => v.labels.operation === operation && v.labels.result === result)?.value ?? 0;
};

describe('CacheStorage', () => {
  let storage: CacheStorage;
  let redisMock: RedisMock;
  let logger: { error: jest.Mock; warn: jest.Mock };

  beforeEach(async () => {
    redisMock = makeRedisMock();

    const redisManager = { getCacheRedis: jest.fn().mockReturnValue(redisMock) };
    logger = { error: jest.fn(), warn: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        CacheStorage,
        { provide: RedisManagerService, useValue: redisManager },
        { provide: LoggerService, useValue: logger },
      ],
    }).compile();

    storage = module.get(CacheStorage);
  });

  describe('negative cases', () => {
    it('del swallows redis error and logs warning', async () => {
      redisMock.del.mockRejectedValue(new Error('redis error'));

      await expect(storage.del('key')).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('delByPattern swallows redis error and logs warning', async () => {
      redisMock.scanStream.mockReturnValue(failingStream());

      await expect(storage.delByPattern('pattern*')).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('delByPattern swallows unlink error and logs warning', async () => {
      redisMock.scanStream.mockReturnValue(Readable.from([['cache:key:1']]));
      redisMock.unlink.mockRejectedValue(new Error('redis error'));

      await expect(storage.delByPattern('key:*')).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('get returns null when key does not exist', async () => {
      redisMock.get.mockResolvedValue(null);

      expect(await storage.get('missing')).toBeNull();
    });

    it('get returns null and logs warning when redis throws', async () => {
      redisMock.get.mockRejectedValue(new Error('redis error'));

      const before = await counterValue('get', 'error');

      expect(await storage.get('key')).toBeNull();
      expect(logger.warn).toHaveBeenCalled();
      expect(await counterValue('get', 'error')).toBe(before + 1);
    });

    it('set swallows redis error and logs warning', async () => {
      redisMock.set.mockRejectedValue(new Error('redis error'));

      await expect(storage.set('key', 'value')).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('delByPattern skips unlink when nothing matches', async () => {
      await storage.delByPattern('empty:*');

      expect(redisMock.unlink).not.toHaveBeenCalled();
    });
  });

  describe('positive cases', () => {
    it('del calls redis.del with the key', async () => {
      await storage.del('my-key');

      expect(redisMock.del).toHaveBeenCalledWith('my-key');
    });

    it('delByPattern scans with the client key prefix and COUNT 100', async () => {
      await storage.delByPattern('key:*');

      expect(redisMock.scanStream).toHaveBeenCalledWith({ count: 100, match: 'cache:key:*' });
    });

    it('delByPattern unlinks each scanned batch once with the prefix stripped', async () => {
      redisMock.scanStream.mockReturnValue(Readable.from([['cache:key:1', 'cache:key:2'], ['cache:key:3']]));

      await storage.delByPattern('key:*');

      expect(redisMock.unlink).toHaveBeenCalledTimes(2);
      expect(redisMock.unlink).toHaveBeenNthCalledWith(1, 'key:1', 'key:2');
      expect(redisMock.unlink).toHaveBeenNthCalledWith(2, 'key:3');
    });

    it('delByPattern works without a key prefix', async () => {
      redisMock.options.keyPrefix = '';
      redisMock.scanStream.mockReturnValue(Readable.from([['key:1']]));

      await storage.delByPattern('key:*');

      expect(redisMock.scanStream).toHaveBeenCalledWith({ count: 100, match: 'key:*' });
      expect(redisMock.unlink).toHaveBeenCalledWith('key:1');
    });

    it('get counts a hit', async () => {
      redisMock.get.mockResolvedValue(JSON.stringify({ id: 1 }));
      const before = await counterValue('get', 'hit');

      await storage.get('key');

      expect(await counterValue('get', 'hit')).toBe(before + 1);
    });

    it('get counts a miss', async () => {
      const before = await counterValue('get', 'miss');

      await storage.get('key');

      expect(await counterValue('get', 'miss')).toBe(before + 1);
    });

    it('set and del record ok', async () => {
      const setBefore = await counterValue('set', 'ok');
      const delBefore = await counterValue('del', 'ok');

      await storage.set('key', 1);
      await storage.del('key');

      expect(await counterValue('set', 'ok')).toBe(setBefore + 1);
      expect(await counterValue('del', 'ok')).toBe(delBefore + 1);
    });

    it('get parses and returns JSON value', async () => {
      redisMock.get.mockResolvedValue(JSON.stringify({ id: 1 }));

      const result = await storage.get<{ id: number }>('key');

      expect(result).toEqual({ id: 1 });
    });

    it('set stores JSON-serialized value without TTL', async () => {
      await storage.set('key', { foo: 'bar' });

      expect(redisMock.set).toHaveBeenCalledWith('key', JSON.stringify({ foo: 'bar' }));
    });

    it('set stores value with EX TTL when ttlSeconds provided', async () => {
      await storage.set('key', 'value', 60);

      expect(redisMock.set).toHaveBeenCalledWith('key', JSON.stringify('value'), 'EX', 60);
    });
  });
});
