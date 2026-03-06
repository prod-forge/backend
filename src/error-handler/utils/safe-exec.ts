import { ErrorCategory } from '../constants/error-category';
import { ErrorCodes } from '../constants/error.codes';
import { BaseError } from '../errors/_base.error';

export async function safeExec<T>(fn: () => Promise<T>, context: string): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw new BaseError(
      `Infrastructure error in ${context}`,
      ErrorCodes.INFRA_FAILURE,
      ErrorCategory.INFRASTRUCTURE,
      500,
      e,
    );
  }
}
