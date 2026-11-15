import { parseJsonArray } from './json';

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

    it('returns valid JSON that is not an array as is, so the array validator can reject it', () => {
      expect(parseJsonArray('{}')).toEqual({});
      expect(parseJsonArray('{"a":1}')).toEqual({ a: 1 });
      expect(parseJsonArray('"a"')).toBe('a');
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
