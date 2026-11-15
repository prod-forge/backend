export function parseJsonArray(value: unknown): unknown {
  if (Array.isArray(value)) return value;

  if (typeof value !== 'string') return [];

  try {
    return JSON.parse(value) as unknown;
  } catch {
    // Keep the raw value so the array validator names the variable instead of crashing on a SyntaxError.
    return value;
  }
}
