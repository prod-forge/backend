import { AsyncLocalStorage } from 'node:async_hooks';

type RequestStore = {
  queryCount: number;
  traceId: string;
};

const storage = new AsyncLocalStorage<RequestStore>();

const RequestContext = {
  getQueryCount(): number {
    return storage.getStore()?.queryCount ?? 0;
  },

  getTraceId(): string {
    return storage.getStore()?.traceId || '';
  },

  incrementQueryCount(): void {
    const store = storage.getStore();
    if (store) {
      store.queryCount += 1;
    }
  },

  run(traceId: string, callback: () => void): void {
    storage.run({ queryCount: 0, traceId }, callback);
  },
};

export { RequestContext };
