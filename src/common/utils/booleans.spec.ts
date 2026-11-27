import { parseStrictBoolean } from './booleans';

describe('parseStrictBoolean', () => {
  describe('negative cases', () => {
    it.each(['1', '0', 'TRUE', 'False', 'yes', '', ' true'])('keeps %j as is so validation rejects it', (value) => {
      expect(parseStrictBoolean(value)).toBe(value);
    });
  });

  describe('positive cases', () => {
    it.each([
      ['true', true],
      ['false', false],
      [true, true],
      [false, false],
    ])('maps %j to %j', (value, expected) => {
      expect(parseStrictBoolean(value)).toBe(expected);
    });
  });
});
