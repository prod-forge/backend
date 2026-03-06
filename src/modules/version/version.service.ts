import type { ConfigType } from '@nestjs/config';

import { Inject, Injectable } from '@nestjs/common';

import { appConfig } from '../../config/app.config';

@Injectable()
export class VersionService {
  constructor(
    @Inject(appConfig.KEY)
    private config: ConfigType<typeof appConfig>,
  ) {}

  getVersion(): string {
    return this.config.appVersion;
  }
}
