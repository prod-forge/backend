import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<undefined | { email: string; id: string }> {
    const user = await this.prisma.user.findUnique({
      select: { email: true, id: true },
      where: { email },
    });

    return user ?? undefined;
  }
}
