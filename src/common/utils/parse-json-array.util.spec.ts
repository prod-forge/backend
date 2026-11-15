import { parseJsonArray } from './parse-json-array.util';

describe('parseJsonArray', () => {
  describe('negative cases', () => {
    it('returns the raw value when it is not valid JSON', () => {
      expect(parseJsonArray('https://a.com')).toBe('https://a.com');
    });

    it('returns the raw value for a JSON array with a missing bracket', () => {
      expect(parseJsonArray('["https://a.com"')).toBe('["https://a.com"');
    });

    it('returns the raw value for an empty string', () => {
      expect(parseJsonArray('')).toBe('');
    });

    it('does not throw on malformed JSON', () => {
      expect(() => parseJsonArray('{not json')).not.toThrow();
    });

    it('returns a parsed non-array value as is, so the array validator can reject it', () => {
      expect(parseJsonArray('{"a":1}')).toEqual({ a: 1 });
    });
  });

  describe('positive cases', () => {
    it('parses a JSON array string', () => {
      expect(parseJsonArray('["a","b"]')).toEqual(['a', 'b']);
    });

    it('parses an empty JSON array string', () => {
      expect(parseJsonArray('[]')).toEqual([]);
    });

    it('returns an array unchanged', () => {
      const input = ['a', 'b'];

      expect(parseJsonArray(input)).toBe(input);
    });

    it.each([undefined, null, 5, true, {}])('returns an empty array for %p', (value) => {
      expect(parseJsonArray(value)).toEqual([]);
    });
  });
});
