import { isObject } from '../../common/utils/objects';

export function frontendMapper(details: unknown): unknown {
  if (isObject(details) && 'driverAdapterError' in details) {
    if (isObject(details.driverAdapterError) && 'cause' in details.driverAdapterError) {
      if (isObject(details.driverAdapterError.cause) && 'message' in details.driverAdapterError.cause) {
        if (typeof details.driverAdapterError.cause.message === 'string') {
          return details.driverAdapterError.cause.message;
        }
      }
    }
  }

  return details;
}
