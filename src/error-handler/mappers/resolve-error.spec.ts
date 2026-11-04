import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

import { ErrorCodes } from '../constants/error.codes';
import { TodoNotFoundError } from '../errors/todo.errors';
import { resolveError, resolveErrorStatus } from './resolve-error';

describe('resolveError', () => {
  describe('negative cases', () => {
    it('hides unknown errors behind a 500', () => {
      expect(resolveErrorStatus(new Error('boom'))).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('hides 5xx HttpException behind a 500', () => {
      const error = resolveError(new HttpException('down', HttpStatus.BAD_GATEWAY));

      expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(error.code).toBe(ErrorCodes.INTERNAL_ERROR);
    });
  });

  describe('positive cases', () => {
    it('returns BaseError unchanged', () => {
      const error = new TodoNotFoundError('1');

      expect(resolveError(error)).toBe(error);
    });

    it('keeps 404 for NotFoundException', () => {
      const error = resolveError(new NotFoundException('Cannot GET /x'));

      expect(error.status).toBe(HttpStatus.NOT_FOUND);
      expect(error.code).toBe(ErrorCodes.NOT_FOUND);
      expect(error.message).toBe('Not Found');
    });

    it('keeps 429 for ThrottlerException', () => {
      const error = resolveError(new ThrottlerException());

      expect(error.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(error.code).toBe(ErrorCodes.TOO_MANY_REQUESTS);
    });

    it('keeps 400 for a malformed body', () => {
      const error = resolveError(new HttpException('Unexpected token', HttpStatus.BAD_REQUEST));

      expect(error.status).toBe(HttpStatus.BAD_REQUEST);
      expect(error.code).toBe(ErrorCodes.BAD_REQUEST);
      expect(error.message).toBe('Bad Request');
    });

    it('uses a generic code for other 4xx statuses', () => {
      const error = resolveError(new HttpException('no', HttpStatus.FORBIDDEN));

      expect(error.status).toBe(HttpStatus.FORBIDDEN);
      expect(error.code).toBe(ErrorCodes.HTTP_EXCEPTION);
    });
  });
});
