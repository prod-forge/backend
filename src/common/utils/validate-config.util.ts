import type { ClassConstructor } from 'class-transformer';
import type { ValidationError } from 'class-validator';

import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

/**
 * Converts a numeric env value to a number, leaving an empty or blank string
 * as `''` so validation rejects it instead of silently accepting it as 0.
 *
 * `plainToInstance` runs implicit conversion before `@Transform`, so by the
 * time a transform sees the value, `''` and `' '` have already become `0` —
 * checking `value` alone cannot tell them apart from `'0'`. The raw env value
 * is still available on `obj`, so the blank string is detected there.
 */
export function toNumber({
  key,
  obj,
  value,
}: {
  key: string;
  obj: Record<string, unknown>;
  value: unknown;
}): number | string {
  const raw = obj[key];

  return typeof raw === 'string' && raw.trim() === '' ? '' : Number(value);
}

export function validateConfig<T extends object>(envVars: ClassConstructor<T>): T {
  const finalConfig = plainToInstance(envVars, process.env, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(finalConfig, {
    skipMissingProperties: false,
  });

  if (errors.length) throw new Error(formatConfigErrors(errors));

  return finalConfig;
}

function formatConfigErrors(errors: readonly ValidationError[]): string {
  const lines = errors.map((err) => {
    const constraints = err.constraints ? Object.values(err.constraints) : [];
    const details = constraints.length ? constraints.join('; ') : 'is invalid';

    return `- ${err.property}: ${details}`;
  });

  return ['Invalid environment variables:', ...lines].join('\n');
}
