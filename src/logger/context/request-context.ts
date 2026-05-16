import { AsyncLocalStorage } from 'node:async_hooks';

class RequestContext {
  private static storage = new AsyncLocalStorage<Map<string, string>>();

  static getTraceId(): string {
    return this.storage.getStore()?.get('x-trace-id') || '';
  }

  static run(traceId: string, callback: () => void): void {
    const store = new Map<string, string>();
    store.set('x-trace-id', traceId);
    this.storage.run(store, callback);
  }
}

export { RequestContext };
