import type { RouteInfo } from '@nestjs/common/interfaces/middleware/index.js';

import { RequestMethod } from '@nestjs/common';

export const HEALTH_ENDPOINT = 'health';

export const METRICS_ENDPOINT = 'metrics';

// Probe and scrape routes live at the root, outside the API prefix
export const GLOBAL_PREFIX_EXCLUDE: (RouteInfo | string)[] = [
  HEALTH_ENDPOINT,
  METRICS_ENDPOINT,
  { method: RequestMethod.ALL, path: `${HEALTH_ENDPOINT}/*path` },
  { method: RequestMethod.ALL, path: `${METRICS_ENDPOINT}/*path` },
];
