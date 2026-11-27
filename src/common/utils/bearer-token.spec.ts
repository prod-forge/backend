import { extractBearerToken } from './bearer-token';

describe('extractBearerToken', () => {
  describe('negative cases', () => {
    it('returns undefined when the header is missing', () => {
      expect(extractBearerToken(undefined)).toBeUndefined();
    });

    it('returns undefined when the header is empty', () => {
      expect(extractBearerToken('')).toBeUndefined();
    });

    it('returns undefined for a non-Bearer scheme', () => {
      expect(extractBearerToken('Basic dXNlcjE=')).toBeUndefined();
    });

    it('returns undefined when the token is missing', () => {
      expect(extractBearerToken('Bearer')).toBeUndefined();
    });

    it('returns undefined when the token is empty', () => {
      expect(extractBearerToken('Bearer ')).toBeUndefined();
    });

    it('returns undefined when the header has no scheme separator', () => {
      expect(extractBearerToken('Bearertoken')).toBeUndefined();
    });
  });

  describe('positive cases', () => {
    it('returns the token for a Bearer scheme', () => {
      expect(extractBearerToken('Bearer valid.token')).toBe('valid.token');
    });

    it('returns the token for a lowercase bearer scheme', () => {
      expect(extractBearerToken('bearer valid.token')).toBe('valid.token');
    });

    it('returns the token for a mixed-case Bearer scheme', () => {
      expect(extractBearerToken('BeArEr valid.token')).toBe('valid.token');
    });
  });
});
