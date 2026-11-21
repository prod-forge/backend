export function parseStrictBoolean(value: unknown): unknown {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;

  // Keep any other value so @IsBoolean() names the variable instead of reading it as true or false.
  return value;
}
