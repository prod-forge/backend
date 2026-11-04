export type DatabaseMetricInterface = {
  calls: number;
  maxMs: number;
  meanMs: number;
  query: string;
  queryId: string;
  totalMs: number;
};
