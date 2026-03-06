import type { ConfigType } from '@nestjs/config';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { appSetup } from './app.setup';
import { appSwaggerSetup } from './app.swagger';
import { appConfig } from './config/app.config';
import { LoggerService } from './logger/logger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const logger = app.get(LoggerService);

  appSetup(app);
  appSwaggerSetup(app);

  const configService = app.get(ConfigService);
  const configApp = configService.getOrThrow<ConfigType<typeof appConfig>>('appConfig');

  await app.listen(configApp.appPort, configApp.appHost, () => {
    logger.log({
      ctx: 'bootstrap',
      msg: `Server is running on port ${configApp.appPort}`,
    });
  });
}

void bootstrap();
