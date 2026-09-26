import { Test } from '@nestjs/testing';

import { prismaMock } from '../../mocks/prisma.mock';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { TodoEntity } from './entities/todo.entity';
import { SortOrder, TodoSortField } from './interfaces/queries.enum';
import { TodosRepository } from './todos.repository';

const todoData = { completed: false, description: null, id: 'todo-1', title: 'Test Todo' };

describe('TodosRepository', () => {
  let repository: TodosRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TodosRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get(TodosRepository);

    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('negative cases', () => {
      it('propagates database error', async () => {
        prismaMock.todo.create.mockRejectedValue(new Error('db error'));

        await expect(repository.create('user-1', { title: 'Test' })).rejects.toThrow('db error');
      });
    });

    describe('positive cases', () => {
      it('creates todo with userId merged from dto', async () => {
        prismaMock.todo.create.mockResolvedValue(todoData);

        const result = await repository.create('user-1', { title: 'Test Todo' });

        expect(prismaMock.todo.create).toHaveBeenCalledWith({
          data: { title: 'Test Todo', userId: 'user-1' },
        });
        expect(result).toEqual(todoData);
      });

      it('creates todo with all optional fields', async () => {
        const full = { ...todoData, completed: true, description: 'desc' };
        prismaMock.todo.create.mockResolvedValue(full);

        const result = await repository.create('user-1', {
          completed: true,
          description: 'desc',
          title: 'Test',
        });

        expect(prismaMock.todo.create).toHaveBeenCalledWith({
          data: { completed: true, description: 'desc', title: 'Test', userId: 'user-1' },
        });
        expect(result).toEqual(full);
      });
    });
  });

  describe('findAll', () => {
    const sort = { order: SortOrder.DESC, sortBy: TodoSortField.TITLE };
    const filter = {};
    const pagination = { limit: 10, offset: 1 };

    describe('negative cases', () => {
      it('uses empty orderBy when sortBy is falsy', async () => {
        prismaMock.$transaction.mockResolvedValue([[], 0]);

        await repository.findAll('user-1', filter, { order: SortOrder.DESC, sortBy: undefined }, pagination);

        expect(prismaMock.todo.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: {} }));
      });
    });

    describe('positive cases', () => {
      it('returns paginated entity with mapped todos', async () => {
        prismaMock.$transaction.mockResolvedValue([[todoData], 1]);

        const result = await repository.findAll('user-1', filter, sort, pagination);

        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toBeInstanceOf(TodoEntity);
        expect(result.data[0].id).toBe('todo-1');
        expect(result.meta).toEqual({ limit: 10, offset: 1, total: 1 });
      });

      it('queries with correct where clause including userId and filter', async () => {
        prismaMock.$transaction.mockResolvedValue([[], 0]);

        await repository.findAll('user-1', { completed: true }, sort, pagination);

        expect(prismaMock.todo.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { completed: true, userId: 'user-1' } }),
        );
        expect(prismaMock.todo.count).toHaveBeenCalledWith({
          where: { completed: true, userId: 'user-1' },
        });
      });

      it('applies correct orderBy from sort query', async () => {
        prismaMock.$transaction.mockResolvedValue([[], 0]);

        await repository.findAll(
          'user-1',
          filter,
          { order: SortOrder.ASC, sortBy: TodoSortField.CREATED_AT },
          pagination,
        );

        expect(prismaMock.todo.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ orderBy: { createdAt: SortOrder.ASC } }),
        );
      });

      it('calculates correct skip from offset', async () => {
        prismaMock.$transaction.mockResolvedValue([[], 0]);

        await repository.findAll('user-1', filter, sort, { limit: 10, offset: 3 });

        expect(prismaMock.todo.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, take: 10 }));
      });

      it('returns empty data when no todos match', async () => {
        prismaMock.$transaction.mockResolvedValue([[], 0]);

        const result = await repository.findAll('user-1', filter, sort, pagination);

        expect(result.data).toHaveLength(0);
        expect(result.meta.total).toBe(0);
      });

      it('maps multiple todos to entities', async () => {
        const second = { completed: true, description: 'desc', id: 'todo-2', title: 'Second' };
        prismaMock.$transaction.mockResolvedValue([[todoData, second], 2]);

        const result = await repository.findAll('user-1', filter, sort, pagination);

        expect(result.data).toHaveLength(2);
        expect(result.data[1].description).toBe('desc');
      });
    });
  });

  describe('findOne', () => {
    describe('negative cases', () => {
      it('returns void when todo does not exist', async () => {
        prismaMock.todo.findUnique.mockResolvedValue(null);

        const result = await repository.findOne('missing-id');

        expect(result).toBeUndefined();
      });
    });

    describe('positive cases', () => {
      it('returns TodoEntity when todo exists', async () => {
        prismaMock.todo.findUnique.mockResolvedValue(todoData);

        const result = await repository.findOne('todo-1');

        expect(result).toBeInstanceOf(TodoEntity);
        expect(result?.id).toBe('todo-1');
      });

      it('queries by id', async () => {
        prismaMock.todo.findUnique.mockResolvedValue(todoData);

        await repository.findOne('todo-1');

        expect(prismaMock.todo.findUnique).toHaveBeenCalledWith({ where: { id: 'todo-1' } });
      });

      it('maps all fields to entity', async () => {
        const full = { completed: true, description: 'desc', id: 'todo-1', title: 'Title' };
        prismaMock.todo.findUnique.mockResolvedValue(full);

        const result = await repository.findOne('todo-1');

        expect(result?.completed).toBe(true);
        expect(result?.description).toBe('desc');
      });
    });
  });

  describe('remove', () => {
    describe('negative cases', () => {
      it('propagates database error on delete', async () => {
        prismaMock.todo.findUnique.mockResolvedValue(todoData);
        prismaMock.todo.delete.mockRejectedValue(new Error('db error'));

        await expect(repository.remove('todo-1')).rejects.toThrow('db error');
      });
    });

    describe('positive cases', () => {
      it('calls findOne then deletes by id', async () => {
        prismaMock.todo.findUnique.mockResolvedValue(todoData);
        prismaMock.todo.delete.mockResolvedValue({});

        await repository.remove('todo-1');

        expect(prismaMock.todo.findUnique).toHaveBeenCalledWith({ where: { id: 'todo-1' } });
        expect(prismaMock.todo.delete).toHaveBeenCalledWith({ where: { id: 'todo-1' } });
      });
    });
  });

  describe('update', () => {
    describe('negative cases', () => {
      it('returns void when prisma update returns falsy', async () => {
        prismaMock.todo.update.mockResolvedValue(undefined);

        const result = await repository.update('todo-1', { title: 'New' });

        expect(result).toBeUndefined();
      });

      it('propagates database error', async () => {
        prismaMock.todo.update.mockRejectedValue(new Error('db error'));

        await expect(repository.update('todo-1', { title: 'New' })).rejects.toThrow('db error');
      });
    });

    describe('positive cases', () => {
      it('updates and returns mapped entity', async () => {
        const updated = { ...todoData, title: 'Updated' };
        prismaMock.todo.update.mockResolvedValue(updated);

        const result = await repository.update('todo-1', { title: 'Updated' });

        expect(result).toBeInstanceOf(TodoEntity);
        expect(result?.title).toBe('Updated');
      });

      it('calls prisma update with correct args', async () => {
        prismaMock.todo.update.mockResolvedValue(todoData);

        await repository.update('todo-1', { completed: true, title: 'New' });

        expect(prismaMock.todo.update).toHaveBeenCalledWith({
          data: { completed: true, title: 'New' },
          where: { id: 'todo-1' },
        });
      });
    });
  });
});
