import { Injectable } from '@nestjs/common';

import { TodosQueryDto } from '../../api/todos/dtos/queries/todos-query.dto';
import { CreateTodoDto } from '../../api/todos/dtos/requests/create-todo.dto';
import { UpdateTodoDto } from '../../api/todos/dtos/requests/update-todo.dto';
import { TodoNotFoundError } from '../../error-handler/errors/todo.errors';
import { CacheStorage } from '../../modules/redis-manager/storages/cache.storage';
import { PaginatedEntity } from '../../shared/entities/paginated.entity';
import { TodosCacheKeys } from './cache-queries/todos.cache-queries';
import { TODOS_MAX_PAGE_SIZE } from './constants/todos.constants';
import { TodoEntity } from './entities/todo.entity';
import { SortOrder, TodoSearchField, TodoSortField } from './interfaces/queries.enum';
import { TodosRepository } from './todos.repository';
import { TodoFilter, TodoPagination, TodoSort } from './types/todo.query';

@Injectable()
export class TodosService {
  constructor(
    private readonly todosRepository: TodosRepository,
    private readonly cacheStorage: CacheStorage,
  ) {}

  async create(userId: string, dto: CreateTodoDto): Promise<TodoEntity> {
    const todo = await this.todosRepository.create(userId, dto);

    await this.cacheStorage.delByPattern(TodosCacheKeys.todosByUser(userId));

    return todo;
  }

  async findAll(userId: string, queryDto: TodosQueryDto): Promise<PaginatedEntity<TodoEntity>> {
    const key = TodosCacheKeys.todos(userId, queryDto);

    const cached = await this.cacheStorage.get<PaginatedEntity<TodoEntity>>(key);

    if (cached) return cached;

    const sortQuery = this.getSortQuery(queryDto);
    const filterQuery = this.getFilterQuery(queryDto);
    const paginationQuery = this.getPaginationQuery(queryDto);

    const result = await this.todosRepository.findAll(userId, filterQuery, sortQuery, paginationQuery);

    await this.cacheStorage.set(key, result, 30);

    return result;
  }

  async findOne(userId: string, id: string): Promise<TodoEntity> {
    const key = TodosCacheKeys.todo(id);

    const cached = await this.cacheStorage.get<TodoEntity>(key);

    // An entry without userId was written by an older version and cannot be authorized, so it counts as a miss
    if (cached?.userId) {
      if (cached.userId !== userId) throw new TodoNotFoundError(id);

      return cached;
    }

    const todo = await this.getOwned(userId, id);

    await this.cacheStorage.set(key, todo, 60);

    return todo;
  }

  getFilterQuery({ completed, search, searchField = TodoSearchField.TITLE }: TodosQueryDto): TodoFilter {
    return {
      ...(completed !== undefined && {
        completed,
      }),
      ...(search && {
        [searchField]: {
          contains: search,
          mode: 'insensitive',
        },
      }),
    };
  }

  getPaginationQuery({ limit, offset }: TodosQueryDto): TodoPagination {
    const defaultLimit = 10;
    const _offset = Math.max(Number(offset) || 0, 0);
    const _limit = Math.min(Math.max(Number(limit) || defaultLimit, 1), TODOS_MAX_PAGE_SIZE);

    return { limit: _limit, offset: _offset };
  }

  getSortQuery({ order, sortBy }: TodosQueryDto): TodoSort {
    return { order: order ?? SortOrder.DESC, sortBy: sortBy ?? TodoSortField.CREATED_AT };
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getOwned(userId, id);

    await this.todosRepository.remove(id);

    await this.invalidate(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateTodoDto): Promise<TodoEntity | undefined> {
    await this.getOwned(userId, id);

    const todo = await this.todosRepository.update(id, dto);

    await this.invalidate(userId, id);

    return todo;
  }

  private async getOwned(userId: string, id: string): Promise<TodoEntity> {
    const todo = await this.todosRepository.findOne(id);

    if (todo?.userId !== userId) throw new TodoNotFoundError(id);

    return todo;
  }

  private async invalidate(userId: string, id: string): Promise<void> {
    await this.cacheStorage.del(TodosCacheKeys.todo(id));
    await this.cacheStorage.delByPattern(TodosCacheKeys.todosByUser(userId));
  }
}
