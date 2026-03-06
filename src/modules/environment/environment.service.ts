import type { ConfigType } from '@nestjs/config';

import { Inject, Injectable } from '@nestjs/common';

import { EnvironmentType } from '../../config/enums/environment.enum';
import { environmentConfig } from '../../config/environment.config';

@Injectable()
export class EnvironmentService {
  constructor(
    @Inject(environmentConfig.KEY)
    private config: ConfigType<typeof environmentConfig>,
  ) {}

  getEnv(): string {
    return this.config.env;
  }

  isProduction(): boolean {
    return this.config.env === EnvironmentType.production;
  }

  isTest(): boolean {
    return this.config.env === EnvironmentType.test;
  }
}
