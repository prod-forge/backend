import type { ClassConstructor } from 'class-transformer';
import type { ValidationError } from 'class-validator';

import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

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
