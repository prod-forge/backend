import type { CallHandler, ExecutionContext } from '@nestjs/common';

import { HttpStatus } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';

import { UnifiedResponseInterceptor } from './unified-response.interceptor';

const makeContext = (path: string): { ctx: ExecutionContext; res: { status: jest.Mock } } => {
  const res = { status: jest.fn().mockReturnThis() };

  return {
    ctx: {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ path }),
        getResponse: jest.fn().mockReturnValue(res),
      }),
    } as unknown as ExecutionContext,
    res,
  };
};

const makeHandler = (data: unknown): CallHandler => ({
  handle: jest.fn().mockReturnValue(of(data)),
});

describe('UnifiedResponseInterceptor', () => {
  let interceptor: UnifiedResponseInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new UnifiedResponseInterceptor({ excludeEndpoints: ['/health', '/metrics'] });
  });

  describe('negative cases', () => {
    it('returns raw data for excluded endpoints', async () => {
      const { ctx } = makeContext('/health');
      const data = { status: 'ok' };

      const result = await firstValueFrom(interceptor.intercept(ctx, makeHandler(data)));

      expect(result).toBe(data);
    });

    it('sets NO_CONTENT status and returns void for empty object', async () => {
      const { ctx, res } = makeContext('/api/todos');

      const result = await firstValueFrom(interceptor.intercept(ctx, makeHandler({})));

      expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
      expect(result).toBeUndefined();
    });

    it('returns void for null data', async () => {
      const { ctx, res } = makeContext('/api/todos');

      const result = await firstValueFrom(interceptor.intercept(ctx, makeHandler(null)));

      expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
      expect(result).toBeUndefined();
    });

    it('returns void for undefined data', async () => {
      const { ctx, res } = makeContext('/api/todos');

      const result = await firstValueFrom(interceptor.intercept(ctx, makeHandler(undefined)));

      expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
      expect(result).toBeUndefined();
    });
  });

  describe('positive cases', () => {
    it('wraps response in data property', async () => {
      const { ctx } = makeContext('/api/todos');
      const data = { id: '1', title: 'Test' };

      const result = await firstValueFrom(interceptor.intercept(ctx, makeHandler(data)));

      expect(result).toEqual({ data });
    });

    it('extracts meta and data when meta present', async () => {
      const { ctx } = makeContext('/api/todos');
      const responseData = { data: [{ id: '1' }], meta: { total: 1 } };

      const result = await firstValueFrom(interceptor.intercept(ctx, makeHandler(responseData)));

      expect(result).toEqual({ data: [{ id: '1' }], meta: { total: 1 } });
    });

    it('wraps non-data-keyed objects in data', async () => {
      const { ctx } = makeContext('/api/todos');
      const payload = { name: 'test', value: 42 };

      const result = await firstValueFrom(interceptor.intercept(ctx, makeHandler(payload)));

      expect(result).toEqual({ data: payload });
    });

    it('passes through raw data for second excluded endpoint', async () => {
      const { ctx } = makeContext('/metrics');
      const data = { metric: 'value' };

      const result = await firstValueFrom(interceptor.intercept(ctx, makeHandler(data)));

      expect(result).toBe(data);
    });

    it('uses data property directly when response has data but no meta', async () => {
      const { ctx } = makeContext('/api/todos');
      const payload = { data: [{ id: '1' }] };

      const result = await firstValueFrom(interceptor.intercept(ctx, makeHandler(payload)));

      expect(result).toEqual({ data: [{ id: '1' }] });
    });

    it('wraps non-data sub-object when meta is present but data property is absent', async () => {
      const { ctx } = makeContext('/api/todos');
      const payload = { items: [{ id: '1' }], meta: { total: 1 } };

      const result = await firstValueFrom(interceptor.intercept(ctx, makeHandler(payload)));

      expect(result).toEqual({ data: { items: [{ id: '1' }] }, meta: { total: 1 } });
    });
  });
});
