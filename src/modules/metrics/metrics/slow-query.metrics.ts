import { Gauge } from '@prometheus-io/client';

let refresh: () => Promise<void> = () => Promise.resolve();

// The gauge is a module-level singleton; the service installs the refresher that runs on every scrape
export const setSlowQueryRefresher = (fn: () => Promise<void>): void => {
  refresh = fn;
};

export const slowQueryMeanMs = new Gauge({
  collect: (): Promise<void> => refresh(),
  help: 'Mean execution time in milliseconds of the slowest queries from pg_stat_statements',
  labelNames: ['queryid'],
  name: 'db_slow_query_mean_ms',
});
