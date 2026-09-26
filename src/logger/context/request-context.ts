import { AsyncLocalStorage } from 'node:async_hooks';

const storage = new AsyncLocalStorage<Map<string, string>>();

const RequestContext = {
  getTraceId(): string {
    return storage.getStore()?.get('x-trace-id') || '';
  },

  run(traceId: string, callback: () => void): void {
    const store = new Map<string, string>();
    store.set('x-trace-id', traceId);
    storage.run(store, callback);
  },
};

export { RequestContext };
