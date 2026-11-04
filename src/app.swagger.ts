import type { INestApplication } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import { ConfigService } from '@nestjs/config';
import { apiReference } from '@scalar/nestjs-api-reference';

import type { swaggerConfig } from './config/swagger.config';

import { createOpenApiDocument } from './app.openapi';
import { LoggerService } from './logger/logger.service';
import { EnvironmentService } from './modules/environment/environment.service';

export const appSwaggerSetup = (app: INestApplication): void => {
  const configService = app.get(ConfigService);
  const configSwagger = configService.getOrThrow<ConfigType<typeof swaggerConfig>>('swaggerConfig');
  const environmentService = app.get(EnvironmentService);
  const logger = app.get(LoggerService);

  if (environmentService.isProduction()) {
    return;
  }

  if (!configSwagger.swaggerEnabled) {
    return;
  }

  const document = createOpenApiDocument(app);

  app.use(
    configSwagger.swaggerEndpoint,
    apiReference({
      content: document,
    }),
  );
  logger.log({
    ctx: 'Swagger',
    msg: `Swagger was installed to ${configSwagger.swaggerEndpoint}`,
  });
};
