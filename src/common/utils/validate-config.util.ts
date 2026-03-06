import type { ValidationError } from 'class-validator';

import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

export function validateConfig<T extends object>(envVars: ClassConstructor<T>): T {
  const finalConfig = plainToInstance(envVars, process.env, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(finalConfig, {
    skipMissingProperties: false,
  });

  let index = 0;

  errors.forEach((err: ValidationError) => {
    if (err.constraints) {
      Object.values(err.constraints).forEach((str) => {
        ++index;
        // eslint-disable-next-line no-console
        console.log(index, str);
      });
      // eslint-disable-next-line no-console
      console.log('\n ***** \n');
    }
  });
  if (errors.length) throw new Error('Please provide the valid ENVs mentioned above');

  return finalConfig;
}
