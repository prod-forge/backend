import { parseBooleanEnv } from './parse-boolean';

describe('parseBooleanEnv', () => {
  describe('negative cases', () => {
    it.each(['maybe', '1', '0', 'TRUE', 'FALSE', 'yes', ''])(
      'returns %s unchanged so @IsBoolean() rejects it',
      (value) => {
        expect(parseBooleanEnv({ value })).toBe(value);
      },
    );
  });

  describe('positive cases', () => {
    it.each([
      ['true', true],
      ['false', false],
      [true, true],
      [false, false],
    ])('maps %s to %s', (value, expected) => {
      expect(parseBooleanEnv({ value })).toBe(expected);
    });
  });
});
