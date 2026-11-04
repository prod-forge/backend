import type { INestApplication } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import packageJson from '../package.json';

// Fixed values keep docs/openapi.json independent of APP_NAME and APP_DESCRIPTION in the environment
const API_TITLE = 'Prod Forge Todo API';
const API_DESCRIPTION = 'REST API of the Prod Forge todo list';

export const createOpenApiDocument = (app: INestApplication): OpenAPIObject => {
  const swaggerOptions = new DocumentBuilder()
    .setTitle(API_TITLE)
    .setDescription(API_DESCRIPTION)
    .setVersion(packageJson.version)
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
