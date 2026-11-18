import type { TransformFnParams } from 'class-transformer';

// Any other value stays as is, so @IsBoolean() names the variable instead of reading a typo as true or false.
export function parseBooleanEnv({ key, obj }: TransformFnParams): unknown {
  const raw = (obj as Record<string, unknown>)[key];

  if (raw === 'true') return true;
  if (raw === 'false') return false;

  return raw;
}
