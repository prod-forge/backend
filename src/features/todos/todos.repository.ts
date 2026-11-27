import { Injectable } from '@nestjs/common';

import { Todo } from '../../../database-manager/generated/client';
import { CreateTodoDto } from '../../api/todos/dtos/requests/create-todo.dto';
import { UpdateTodoDto } from '../../api/todos/dtos/requests/update-todo.dto';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { TodoEntity } from './entities/todo.entity';
import { TodosPageEntity } from './entities/todos-page.entity';
import { TodoMapper } from './mappers/todo.mapper';
import { TodoFilter, TodoPagination, TodoSort } from './types/todo.query';

@Injectable()
export class TodosRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateTodoDto): Promise<Todo> {
    return this.prisma.todo.create({
      data: { completed: dto.completed, description: dto.description, title: dto.title, userId },
    });
  }

  async findAll(
    userId: string,
    filter: TodoFilter,
    { order, sortBy }: TodoSort,
    pagination: TodoPagination,
  ): Promise<TodosPageEntity> {
    const { limit, offset } = pagination;
    // id is unique, so rows that tie on sortBy keep the same order across offset pages.
    const tiebreaker = { id: 'asc' as const };
    const orderBy = sortBy ? [{ [sortBy]: order }, tiebreaker] : [tiebreaker];
    const where = { ...filter, userId };

    const [items, total, completed] = await this.prisma.$transaction([
      this.prisma.todo.findMany({
        orderBy: orderBy,
        skip: offset,
        take: limit,
        where,
      }),
      this.prisma.todo.count({ where }),
      // AND keeps a completed=false filter at 0 instead of overriding it
      this.prisma.todo.count({ where: { AND: [where, { completed: true }] } }),
    ]);

    return new TodosPageEntity({
      completed,
      items: items.map((item) => TodoMapper.toEntity(item)),
      limit,
      offset,
      total,
    });
  }

  async findOne(id: string): Promise<TodoEntity | undefined> {
    const todo = await this.prisma.todo.findUnique({ where: { id } });

    if (todo) return TodoMapper.toEntity(todo);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.todo.delete({ where: { id } });
  }

  async update(id: string, dto: UpdateTodoDto): Promise<TodoEntity | undefined> {
    // A falsy result is guarded although Prisma throws on a missing record.
    const todo = (await this.prisma.todo.update({ data: dto, where: { id } })) as null | Todo;

    if (todo) return TodoMapper.toEntity(todo);
  }
}
