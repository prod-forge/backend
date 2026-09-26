import { ErrorCategory } from '../constants/error-category';
import { ErrorCodes } from '../constants/error.codes';
import { BaseError } from '../errors/_base.error';
import { safeExec } from './safe-exec';

describe('safeExec', () => {
  describe('negative cases', () => {
    it('wraps thrown error in BaseError with INFRA_FAILURE code', async () => {
      const fn = (): Promise<BaseError<string>> => Promise.reject(new Error('boom'));

      const error = await safeExec(fn, 'TestContext').catch((e: unknown) => e as BaseError<unknown>);

      expect(error).toBeInstanceOf(BaseError);
      expect(error.code).toBe(ErrorCodes.INFRA_FAILURE);
    });

    it('includes context name in the error message', async () => {
      const fn = (): Promise<BaseError<string>> => Promise.reject(new Error('fail'));

      const error = await safeExec(fn, 'MyService').catch((e: unknown) => e as BaseError<unknown>);

      expect(error.message).toContain('MyService');
    });

    it('attaches the original error as details', async () => {
      const original = new Error('original error');
      const fn = (): Promise<BaseError<string>> => Promise.reject(original);

      const error = await safeExec(fn, 'ctx').catch((e: unknown) => e as BaseError<unknown>);

      expect(error.details).toBe(original);
    });

    it('sets category to INFRASTRUCTURE', async () => {
      const fn = (): Promise<BaseError<string>> => Promise.reject(new Error('fail'));

      const error = await safeExec(fn, 'ctx').catch((e: unknown) => e as BaseError<unknown>);

      expect(error.category).toBe(ErrorCategory.INFRASTRUCTURE);
    });

    it('sets HTTP status to 500', async () => {
      const fn = (): Promise<BaseError<string>> => Promise.reject(new Error('fail'));

      const error = await safeExec(fn, 'ctx').catch((e: unknown) => e as BaseError<unknown>);

      expect(error.status).toBe(500);
    });

    it('handles non-Error thrown values', async () => {
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      const fn = (): Promise<BaseError<string>> => Promise.reject('string error');

      const error = await safeExec(fn, 'ctx').catch((e: unknown) => e as BaseError<unknown>);

      expect(error).toBeInstanceOf(BaseError);
      expect(error.details).toBe('string error');
    });
  });

  describe('positive cases', () => {
    it('returns the resolved value from the function', async () => {
      const fn = (): Promise<number> => Promise.resolve(42);

      const result = await safeExec(fn, 'ctx');

      expect(result).toBe(42);
    });

    it('returns an object result without modification', async () => {
      const data = { id: 1, name: 'test' };
      const fn = (): Promise<{ id: number; name: string }> => Promise.resolve(data);

      const result = await safeExec(fn, 'ctx');

      expect(result).toBe(data);
    });
  });
});
