import type { ClassConstructor } from 'class-transformer';
import type { ValidationError } from 'class-validator';

import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

/**
 * Converts a numeric env value to a number, leaving an empty string as-is so
 * validation rejects it instead of silently accepting it as 0.
 *
 * `plainToInstance` runs implicit conversion before `@Transform`, so by the
 * time a transform sees the value, `''` has already become `0` — checking
 * `value` alone cannot tell `''` apart from `'0'`. The raw env value is
 * still available on `obj`, so the empty string is detected there.
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
  return obj[key] === '' ? '' : Number(value);
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
