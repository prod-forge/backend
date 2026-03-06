import { Module } from '@nestjs/common';

import { TodosController } from '../../api/todos/todos.controller';
import { PrismaModule } from '../../modules/prisma/prisma.module';
import { RedisManagerModule } from '../../modules/redis-manager/redis-manager.module';
import { TodosRepository } from './todos.repository';
import { TodosService } from './todos.service';

@Module({
  controllers: [TodosController],
  imports: [PrismaModule, RedisManagerModule],
  providers: [TodosService, TodosRepository],
})
export class TodosModule {}
