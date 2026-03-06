export interface DatabaseMetricInterface {
  calls: number;
  maxMs: number;
  meanMs: number;
  query: string;
  totalMs: number;
}
