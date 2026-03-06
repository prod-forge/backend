import { AsyncLocalStorage } from 'async_hooks';

class RequestContext {
  private static storage = new AsyncLocalStorage<Map<string, string>>();

  static getCorrelationId(): string {
    return this.storage.getStore()?.get('x-correlation-id') || '';
  }

  static run(correlationId: string, callback: () => void): void {
    const store = new Map<string, string>();
    store.set('x-correlation-id', correlationId);
    this.storage.run(store, callback);
  }
}

export { RequestContext };
