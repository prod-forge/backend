import type { INestApplication } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { OpenAPIObject } from '@nestjs/swagger';

import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import type { appConfig } from './config/app.config';

export const createOpenApiDocument = (app: INestApplication): OpenAPIObject => {
  const configApp = app.get(ConfigService).getOrThrow<ConfigType<typeof appConfig>>('appConfig');

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

  return SwaggerModule.createDocument(app, swaggerOptions, {
    deepScanRoutes: true,
  });
};
