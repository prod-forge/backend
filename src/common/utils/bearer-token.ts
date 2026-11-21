/**
 * Extracts the token from an `Authorization` header value.
 *
 * RFC 7235 (section 2.1) makes the auth scheme case-insensitive, so
 * `bearer <token>` is as valid as `Bearer <token>`. Returns `undefined`
 * for anything else, including a missing or empty token.
 */
export function extractBearerToken(header: string | undefined): string | undefined {
  if (!header) return undefined;

  const [scheme, token] = header.split(' ');

  if (scheme.toLowerCase() !== 'bearer' || !token) return undefined;

  return token;
}
