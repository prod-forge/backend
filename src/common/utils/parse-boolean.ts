type BooleanEnvValue = {
  readonly value: unknown;
};

// Strict boolean env parsing, following the REDIS_TLS pattern: only the
// strings 'true' and 'false' (or real booleans) become booleans. Anything
// else is returned unchanged so the @IsBoolean() check after it fails and
// validateConfig reports the variable instead of silently coercing it.
// An unset variable never reaches this transform (class-transformer only
// transforms keys present in process.env), so the field default is kept.
export function parseBooleanEnv({ value }: BooleanEnvValue): unknown {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;

  return value;
}
