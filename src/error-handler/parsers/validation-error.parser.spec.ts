import { ValidationError } from 'class-validator';

import { parseValidationErrors } from './validation-error.parser';

function makeError(
  property: string,
  constraints?: Record<string, string>,
  children?: ValidationError[],
): ValidationError {
  const err = new ValidationError();
  err.property = property;
  err.constraints = constraints;
  err.children = children;

  return err;
}

describe('parseValidationErrors', () => {
  describe('negative cases', () => {
    it('returns empty object for empty errors array', () => {
      expect(parseValidationErrors([])).toEqual({});
    });

    it('returns empty object for error with no constraints and no children', () => {
      const errors = [makeError('title')];

      expect(parseValidationErrors(errors)).toEqual({});
    });
  });

  describe('positive cases', () => {
    it('extracts constraint messages for a single field', () => {
      const errors = [makeError('title', { isString: 'title must be a string' })];

      expect(parseValidationErrors(errors)).toEqual({
        title: ['title must be a string'],
      });
    });

    it('collects multiple constraint messages for one field', () => {
      const errors = [
        makeError('title', {
          isString: 'must be string',
          minLength: 'min length 3',
        }),
      ];

      const result = parseValidationErrors(errors);

      expect(result.title).toEqual(expect.arrayContaining(['must be string', 'min length 3']));
      expect(result.title).toHaveLength(2);
    });

    it('collects constraints across multiple fields', () => {
      const errors = [
        makeError('title', { isString: 'must be string' }),
        makeError('completed', { isBoolean: 'must be boolean' }),
      ];

      const result = parseValidationErrors(errors);

      expect(result).toEqual({
        completed: ['must be boolean'],
        title: ['must be string'],
      });
    });

    it('flattens nested errors using dot notation', () => {
      const child = makeError('name', { isString: 'must be string' });
      const errors = [makeError('address', undefined, [child])];

      const result = parseValidationErrors(errors);

      expect(result).toEqual({ 'address.name': ['must be string'] });
    });

    it('flattens deeply nested errors', () => {
      const grandchild = makeError('city', { isString: 'must be string' });
      const child = makeError('location', undefined, [grandchild]);
      const errors = [makeError('user', undefined, [child])];

      const result = parseValidationErrors(errors);

      expect(result).toEqual({ 'user.location.city': ['must be string'] });
    });

    it('handles parent with constraints and children simultaneously', () => {
      const child = makeError('street', { isString: 'must be string' });
      const errors = [makeError('address', { isObject: 'must be object' }, [child])];

      const result = parseValidationErrors(errors);

      expect(result).toEqual({
        address: ['must be object'],
        'address.street': ['must be string'],
      });
    });

    it('prepends parentPath when provided', () => {
      const errors = [makeError('title', { isString: 'must be string' })];

      const result = parseValidationErrors(errors, 'dto');

      expect(result).toEqual({ 'dto.title': ['must be string'] });
    });
  });
});
