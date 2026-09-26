import { capitalizeFirstLetter } from './strings';

describe('capitalizeFirstLetter', () => {
  describe('negative cases', () => {
    it('returns empty string unchanged', () => {
      expect(capitalizeFirstLetter('')).toBe('');
    });
  });

  describe('positive cases', () => {
    it('capitalizes the first letter of a lowercase string', () => {
      expect(capitalizeFirstLetter('hello')).toBe('Hello');
    });

    it('leaves an already-capitalized string unchanged', () => {
      expect(capitalizeFirstLetter('Hello')).toBe('Hello');
    });

    it('capitalizes only the first letter, leaving the rest intact', () => {
      expect(capitalizeFirstLetter('hELLO')).toBe('HELLO');
    });

    it('handles a single character', () => {
      expect(capitalizeFirstLetter('a')).toBe('A');
    });

    it('coerces a number to string before capitalizing', () => {
      expect(capitalizeFirstLetter(123)).toBe('123');
    });

    it('handles a string starting with a space', () => {
      expect(capitalizeFirstLetter(' hello')).toBe(' hello');
    });
  });
});
