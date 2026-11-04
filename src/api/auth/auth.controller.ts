import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import type { authConfig } from '../../config/auth.config';

import { Public } from '../../common/decorators/public.decorator';
import { ApiErrors, ApiOk } from '../../common/decorators/swagger.decorators';
import { InternalServerError } from '../../error-handler/errors/common.errors';
import { DtoValidationErrors } from '../../error-handler/errors/dto-validation.errors';
import { UserIsNotAuthorizedError } from '../../error-handler/errors/user.errors';
import { UsersService } from '../../features/users/users.service';
import { LoginDto } from './dtos/requests/login.dto';
import { TokenResponseDto } from './dtos/responses/token-response.dto';

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
@Public()
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @ApiErrors(DtoValidationErrors, UserIsNotAuthorizedError, InternalServerError)
  @ApiOk(TokenResponseDto, {
    access: false,
    description: 'Exchange a registered email for a signed access token. Development stub: no password is checked.',
    title: 'Login',
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() { email }: LoginDto): Promise<TokenResponseDto> {
    const accessToken = await this.usersService.issueTokenByEmail(email);
    const { jwtTtl } = this.configService.getOrThrow<ConfigType<typeof authConfig>>('authConfig');

    return { accessToken, expiresIn: jwtTtl };
  }
}
