import 'reflect-metadata';
import type { ClassTransformOptions } from 'class-transformer';

import { TransformationType } from 'class-transformer';
import * as classValidator from 'class-validator';
import { IsIn, IsNumber, IsString } from 'class-validator';

import { toNumber, validateConfig } from './validate-config.util';

class MultiConfig {
  @IsNumber()
  OTHER_VAR = 0;

  @IsIn(['allowed'])
  REQUIRED_VAR = 'not-allowed';
}

class StrictConfig {
  @IsIn(['allowed'])
  REQUIRED_VAR = 'not-allowed';
}

class ValidConfig {
  @IsString()
  TEST_VAR = '';
}

describe('validateConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('negative cases', () => {
    it('throws when env var has invalid value', () => {
      process.env.REQUIRED_VAR = 'invalid-value';

      expect(() => validateConfig(StrictConfig)).toThrow(
        'Invalid environment variables:\n- REQUIRED_VAR: REQUIRED_VAR must be one of the following values: allowed',
      );
    });

    it('lists every failed variable on its own line', () => {
      process.env.REQUIRED_VAR = 'invalid-value';
      process.env.OTHER_VAR = 'abc';

      expect(() => validateConfig(MultiConfig)).toThrow(
        [
          'Invalid environment variables:',
          '- OTHER_VAR: OTHER_VAR must be a number conforming to the specified constraints',
          '- REQUIRED_VAR: REQUIRED_VAR must be one of the following values: allowed',
        ].join('\n'),
      );
    });

    it('does not write to the console', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      process.env.REQUIRED_VAR = 'invalid-value';

      expect(() => validateConfig(StrictConfig)).toThrow();
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('still throws when ValidationError has no constraints', () => {
      jest
        .spyOn(classValidator, 'validateSync')
        .mockReturnValueOnce([{ children: [], constraints: undefined, property: 'test' }]);

      expect(() => validateConfig(ValidConfig)).toThrow('Invalid environment variables:\n- test: is invalid');
    });
  });

  describe('positive cases', () => {
    it('returns config instance when env vars are valid', () => {
      process.env.TEST_VAR = 'hello';

      const result = validateConfig(ValidConfig);

      expect(result.TEST_VAR).toBe('hello');
    });

    it('returns an instance of the config class', () => {
      process.env.TEST_VAR = 'test';

      const result = validateConfig(ValidConfig);

      expect(result).toBeInstanceOf(ValidConfig);
    });
  });
});

describe('toNumber', () => {
  const params = (
    value: unknown,
    raw: unknown,
  ): {
    key: string;
    obj: { APP_PORT: unknown };
    options: ClassTransformOptions;
    type: TransformationType;
    value: unknown;
  } => ({
    key: 'APP_PORT',
    obj: { APP_PORT: raw },
    options: {},
    type: TransformationType.PLAIN_TO_CLASS,
    value,
  });

  describe('negative cases', () => {
    it('returns an empty string unchanged so validation rejects it instead of accepting 0', () => {
      expect(toNumber(params(0, ''))).toBe('');
    });

    it('returns an empty string for a blank value so validation rejects it instead of accepting 0', () => {
      expect(toNumber(params(0, '  '))).toBe('');
    });
  });

  describe('positive cases', () => {
    it('converts a numeric string to a number', () => {
      expect(toNumber(params('3000', '3000'))).toBe(3000);
    });

    it('leaves an already converted number unchanged', () => {
      expect(toNumber(params(3000, '3000'))).toBe(3000);
    });
  });
});
