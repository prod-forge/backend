import { INestApplication } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

import { appConfig } from './config/app.config';
import { swaggerConfig } from './config/swagger.config';
import { LoggerService } from './logger/logger.service';
import { EnvironmentService } from './modules/environment/environment.service';

export const appSwaggerSetup = (app: INestApplication): void => {
  const configService = app.get(ConfigService);
  const configSwagger = configService.getOrThrow<ConfigType<typeof swaggerConfig>>('swaggerConfig');
  const configApp = configService.getOrThrow<ConfigType<typeof appConfig>>('appConfig');
  const environmentService = app.get(EnvironmentService);
  const logger = app.get(LoggerService);

  if (environmentService.isProduction()) {
    return;
  }

  if (!configSwagger.swaggerEnabled) {
    return;
  }

  const swaggerOptions = new DocumentBuilder()
    .setTitle(configApp.appName)
    .setDescription(configApp.appDescription)
    .setVersion(configApp.appVersion)
    .setExternalDoc(
      'For Validation Errors please check class-validator',
      'https://github.com/typestack/class-validator#validation-errors',
    )
    .addGlobalResponse({
      description: 'Internal server error',
      status: 500,
    })
    .addBearerAuth(
      {
        bearerFormat: 'JWT',
        scheme: 'bearer',
        type: 'http',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerOptions, {
    deepScanRoutes: true,
  });

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
