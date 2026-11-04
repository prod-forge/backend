import { Module } from '@nestjs/common';

import { AuthModule } from '../../modules/auth/auth.module';
import { PrismaModule } from '../../modules/prisma/prisma.module';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  exports: [UsersService],
  imports: [AuthModule, PrismaModule],
  providers: [UsersRepository, UsersService],
})
export class UsersModule {}
