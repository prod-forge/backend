import { ValidationError } from 'class-validator';

export function parseValidationErrors(errors: ValidationError[], parentPath = ''): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const error of errors) {
    const fieldPath = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      result[fieldPath] = Object.values(error.constraints);
    }

    if (error.children?.length) {
      Object.assign(result, parseValidationErrors(error.children, fieldPath));
    }
  }

  return result;
}
