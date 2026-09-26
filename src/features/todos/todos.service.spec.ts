import { Test } from '@nestjs/testing';

import type { TodosQueryDto } from '../../api/todos/dtos/queries/todos-query.dto';

import { TodoNotFoundError } from '../../error-handler/errors/todo.errors';
import { cacheStorageMock } from '../../mocks/cache-storage.mock';
import { prismaMock } from '../../mocks/prisma.mock';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { CacheStorage } from '../../modules/redis-manager/storages/cache.storage';
import { PaginatedEntity } from '../../shared/entities/paginated.entity';
import { SortOrder, TodoSearchField, TodoSortField } from './interfaces/queries.enum';
import { TodosRepository } from './todos.repository';
import { TodosService } from './todos.service';

const todoData = { completed: false, description: null, id: 'todo-1', title: 'Test Todo' };

describe('TodosService', () => {
  let service: TodosService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TodosService,
        TodosRepository,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CacheStorage, useValue: cacheStorageMock },
      ],
    }).compile();

    service = module.get(TodosService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('negative cases', () => {
      it('propagates error when repository throws', async () => {
        prismaMock.todo.create.mockRejectedValue(new Error('db error'));

        await expect(service.create('user-1', { title: 'Test' })).rejects.toThrow('db error');
      });

      it('propagates error when cache invalidation fails', async () => {
        prismaMock.todo.create.mockResolvedValue(todoData);
        cacheStorageMock.delByPattern.mockRejectedValue(new Error('redis error'));

        await expect(service.create('user-1', { title: 'Test' })).rejects.toThrow('redis error');
      });
    });

    describe('positive cases', () => {
      it('creates todo, invalidates user cache, and returns the created entity', async () => {
        prismaMock.todo.create.mockResolvedValue(todoData);
        cacheStorageMock.delByPattern.mockResolvedValue(undefined);

        const result = await service.create('user-1', { title: 'Test Todo' });

        expect(result.id).toBe('todo-1');
        expect(prismaMock.todo.create).toHaveBeenCalledWith({
          data: { title: 'Test Todo', userId: 'user-1' },
        });
        expect(cacheStorageMock.delByPattern).toHaveBeenCalledWith('todos:user-1:*');
      });

      it('creates todo with optional fields', async () => {
        const full = { ...todoData, completed: true, description: 'Buy oat milk' };
        prismaMock.todo.create.mockResolvedValue(full);

        const result = await service.create('user-1', {
          completed: true,
          description: 'Buy oat milk',
          title: 'Buy milk',
        });

        expect(result.description).toBe('Buy oat milk');
        expect(result.completed).toBe(true);
      });
    });
  });

  describe('findAll', () => {
    const query: TodosQueryDto = {};

    describe('positive cases', () => {
      it('returns cached result without hitting the repository', async () => {
        const cached = new PaginatedEntity({ items: [todoData], limit: 10, offset: 1, total: 1 });
        cacheStorageMock.get.mockResolvedValue(cached);

        const result = await service.findAll('user-1', query);

        expect(result).toBe(cached);
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
        expect(cacheStorageMock.set).not.toHaveBeenCalled();
      });

      it('fetches from repository on cache miss, stores in cache, and returns result', async () => {
        cacheStorageMock.get.mockResolvedValue(null);
        prismaMock.$transaction.mockResolvedValue([[todoData], 1]);
        cacheStorageMock.set.mockResolvedValue(undefined);

        const result = await service.findAll('user-1', query);

        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe('todo-1');
        expect(result.meta.total).toBe(1);
        expect(cacheStorageMock.set).toHaveBeenCalledWith(
          expect.stringContaining('todos:user-1:'),
          expect.any(PaginatedEntity),
          30,
        );
      });

      it('returns empty paginated result when no todos exist', async () => {
        cacheStorageMock.get.mockResolvedValue(null);
        prismaMock.$transaction.mockResolvedValue([[], 0]);

        const result = await service.findAll('user-1', query);

        expect(result.data).toHaveLength(0);
        expect(result.meta.total).toBe(0);
      });
    });
  });

  describe('findOne', () => {
    describe('negative cases', () => {
      it('throws TodoNotFoundError when todo does not exist', async () => {
        cacheStorageMock.get.mockResolvedValue(null);
        prismaMock.todo.findUnique.mockResolvedValue(null);

        await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(TodoNotFoundError);
      });

      it('TodoNotFoundError contains the requested id', async () => {
        cacheStorageMock.get.mockResolvedValue(null);
        prismaMock.todo.findUnique.mockResolvedValue(null);

        await expect(service.findOne('missing-id')).rejects.toMatchObject({ details: { id: 'missing-id' } });
      });
    });

    describe('positive cases', () => {
      it('returns cached todo without querying repository', async () => {
        cacheStorageMock.get.mockResolvedValue(todoData);

        const result = await service.findOne('todo-1');

        expect(result).toBe(todoData);
        expect(prismaMock.todo.findUnique).not.toHaveBeenCalled();
      });

      it('fetches from repository on cache miss, caches result, and returns entity', async () => {
        cacheStorageMock.get.mockResolvedValue(null);
        prismaMock.todo.findUnique.mockResolvedValue(todoData);
        cacheStorageMock.set.mockResolvedValue(undefined);

        const result = await service.findOne('todo-1');

        expect(result.id).toBe('todo-1');
        expect(cacheStorageMock.set).toHaveBeenCalledWith('todo:todo-1', expect.objectContaining({ id: 'todo-1' }), 60);
      });
    });
  });

  describe('remove', () => {
    describe('negative cases', () => {
      it('throws TodoNotFoundError when todo does not exist', async () => {
        prismaMock.todo.findUnique.mockResolvedValue(null);

        await expect(service.remove('missing-id')).rejects.toBeInstanceOf(TodoNotFoundError);
      });

      it('does not call delete when todo is not found', async () => {
        prismaMock.todo.findUnique.mockResolvedValue(null);

        await service.remove('missing-id').catch(() => {
          return;
        });

        expect(prismaMock.todo.delete).not.toHaveBeenCalled();
      });
    });

    describe('positive cases', () => {
      it('deletes todo from repository and removes from cache', async () => {
        prismaMock.todo.findUnique.mockResolvedValue(todoData);
        prismaMock.todo.delete.mockResolvedValue({});
        cacheStorageMock.del.mockResolvedValue(undefined);

        await service.remove('todo-1');

        expect(prismaMock.todo.delete).toHaveBeenCalledWith({ where: { id: 'todo-1' } });
        expect(cacheStorageMock.del).toHaveBeenCalledWith('todo:todo-1');
      });
    });
  });

  describe('update', () => {
    describe('positive cases', () => {
      it('updates todo, clears cache, and returns updated entity', async () => {
        const updated = { ...todoData, title: 'Updated Title' };
        prismaMock.todo.update.mockResolvedValue(updated);
        cacheStorageMock.del.mockResolvedValue(undefined);

        const result = await service.update('todo-1', { title: 'Updated Title' });

        expect(result?.title).toBe('Updated Title');
        expect(cacheStorageMock.del).toHaveBeenCalledWith('todo:todo-1');
      });

      it('clears cache even when update returns void', async () => {
        prismaMock.todo.update.mockResolvedValue(undefined);

        await service.update('todo-1', { title: 'X' });

        expect(cacheStorageMock.del).toHaveBeenCalledWith('todo:todo-1');
      });
    });
  });

  describe('getFilterQuery', () => {
    describe('positive cases', () => {
      it('returns empty filter when no query params are provided', () => {
        const result = service.getFilterQuery({});

        expect(result).toEqual({});
      });

      it('includes completed=true in filter', () => {
        const result = service.getFilterQuery({ completed: true });

        expect(result).toEqual({ completed: true });
      });

      it('includes completed=false in filter', () => {
        const result = service.getFilterQuery({ completed: false });

        expect(result).toEqual({ completed: false });
      });

      it('filters by search using the default title field', () => {
        const result = service.getFilterQuery({ search: 'milk' });

        expect(result).toEqual({
          title: { contains: 'milk', mode: 'insensitive' },
        });
      });

      it('filters by search using the description field', () => {
        const result = service.getFilterQuery({ search: 'milk', searchField: TodoSearchField.DESCRIPTION });

        expect(result).toEqual({
          description: { contains: 'milk', mode: 'insensitive' },
        });
      });

      it('combines completed and search filters', () => {
        const result = service.getFilterQuery({ completed: true, search: 'buy' });

        expect(result).toEqual({
          completed: true,
          title: { contains: 'buy', mode: 'insensitive' },
        });
      });
    });
  });

  describe('getPaginationQuery', () => {
    describe('positive cases', () => {
      it('returns defaults when no params are provided', () => {
        const result = service.getPaginationQuery({});

        expect(result).toEqual({ limit: 10, offset: 1 });
      });

      it('returns provided limit and offset', () => {
        const result = service.getPaginationQuery({ limit: 20, offset: 3 });

        expect(result).toEqual({ limit: 20, offset: 3 });
      });

      it('clamps offset of 0 to 1', () => {
        const result = service.getPaginationQuery({ offset: 0 });

        expect(result.offset).toBe(1);
      });

      it('clamps negative offset to 1', () => {
        const result = service.getPaginationQuery({ offset: -5 });

        expect(result.offset).toBe(1);
      });

      it('clamps negative limit to 1', () => {
        const result = service.getPaginationQuery({ limit: -1 });

        expect(result.limit).toBe(1);
      });
    });
  });

  describe('getSortQuery', () => {
    describe('positive cases', () => {
      it('returns title desc by default when no params are provided', () => {
        const result = service.getSortQuery({});

        expect(result).toEqual({ order: SortOrder.DESC, sortBy: TodoSortField.TITLE });
      });

      it('uses provided order when sortBy is absent', () => {
        const result = service.getSortQuery({ order: SortOrder.ASC });

        expect(result).toEqual({ order: SortOrder.ASC, sortBy: TodoSortField.TITLE });
      });

      it('uses provided sortBy with default desc order', () => {
        const result = service.getSortQuery({ sortBy: TodoSortField.CREATED_AT });

        expect(result).toEqual({ order: SortOrder.DESC, sortBy: TodoSortField.CREATED_AT });
      });

      it('uses provided sortBy and order', () => {
        const result = service.getSortQuery({ order: SortOrder.ASC, sortBy: TodoSortField.COMPLETED });

        expect(result).toEqual({ order: SortOrder.ASC, sortBy: TodoSortField.COMPLETED });
      });
    });
  });
});
