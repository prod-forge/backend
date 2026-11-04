import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import type { ConfigType } from '@nestjs/config';

import type { apiConfig } from './config/api.config';

export const buildCorsOptions = (configApi: ConfigType<typeof apiConfig>): CorsOptions => ({
  credentials: true,
  // Browsers hide non-simple response headers from cross-origin scripts unless listed here.
  exposedHeaders: ['X-Trace-Id'],
  // Browsers hide non-simple response headers from cross-origin scripts unless listed here.
  origin: (origin: string | undefined, cb: (a: null, b: boolean) => void): void => {
    if (!origin) {
      cb(null, configApi.apiAllowNonBrowserOrigins);

      return;
    }

    cb(null, configApi.apiAllowedOrigins.includes(origin));
  },
});
