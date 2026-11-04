import { Module } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import type { authConfig } from '../../config/auth.config';

import { AuthService } from './auth.service';

@Module({
  exports: [AuthService],
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.getOrThrow<ConfigType<typeof authConfig>>('authConfig');

        return {
          secret: config.jwtSecret,
          signOptions: { algorithm: 'HS256', expiresIn: config.jwtTtl },
        };
      },
    }),
  ],
  providers: [AuthService],
})
export class AuthModule {}
