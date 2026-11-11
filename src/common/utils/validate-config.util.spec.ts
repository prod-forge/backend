import 'reflect-metadata';
import * as classValidator from 'class-validator';
import { IsIn, IsNumber, IsString } from 'class-validator';

import { validateConfig } from './validate-config.util';

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
