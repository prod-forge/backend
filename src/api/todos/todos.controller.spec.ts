import { Test } from '@nestjs/testing';

import { TodosService } from '../../features/todos/todos.service';
import { AuthService } from '../../modules/auth/auth.service';
import { TodoResponseDto } from './dtos/responses/todo-response.dto';
import { TodosController } from './todos.controller';

const todoData = { completed: false, description: null, id: 'todo-1', title: 'Test Todo' };
const userInterface = { userId: 'user-1' };

describe('TodosController', () => {
  let controller: TodosController;
  let service: { create: jest.Mock; findAll: jest.Mock; findOne: jest.Mock; remove: jest.Mock; update: jest.Mock };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [TodosController],
      providers: [
        { provide: TodosService, useValue: service },
        { provide: AuthService, useValue: {} },
      ],
    }).compile();

    controller = module.get(TodosController);

    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('negative cases', () => {
      it('propagates service error', async () => {
        service.create.mockRejectedValue(new Error('db error'));

        await expect(controller.create({ title: 'Test' }, userInterface)).rejects.toThrow('db error');
      });
    });

    describe('positive cases', () => {
      it('creates todo and returns DTO', async () => {
        service.create.mockResolvedValue(todoData);

        const result = await controller.create({ title: 'Test Todo' }, userInterface);

        expect(result).toBeInstanceOf(TodoResponseDto);
        expect(result.id).toBe('todo-1');
        expect(service.create).toHaveBeenCalledWith('user-1', { title: 'Test Todo' });
      });
    });
  });

  describe('findAll', () => {
    describe('positive cases', () => {
      it('returns paginated todos DTO', async () => {
        const paginatedResult = {
          data: [todoData],
          meta: { limit: 10, offset: 1, total: 1 },
        };
        service.findAll.mockResolvedValue(paginatedResult);

        const result = await controller.findAll(userInterface, {});

        expect(service.findAll).toHaveBeenCalledWith('user-1', {});
        expect(result).toBeDefined();
      });
    });
  });

  describe('findOne', () => {
    describe('negative cases', () => {
      it('propagates service error', async () => {
        service.findOne.mockRejectedValue(new Error('not found'));

        await expect(controller.findOne('missing-id')).rejects.toThrow('not found');
      });
    });

    describe('positive cases', () => {
      it('returns todo DTO by id', async () => {
        service.findOne.mockResolvedValue(todoData);

        const result = await controller.findOne('todo-1');

        expect(result).toBeInstanceOf(TodoResponseDto);
        expect(result.id).toBe('todo-1');
        expect(service.findOne).toHaveBeenCalledWith('todo-1');
      });
    });
  });

  describe('remove', () => {
    describe('negative cases', () => {
      it('propagates service error', async () => {
        service.remove.mockRejectedValue(new Error('not found'));

        await expect(controller.remove('missing')).rejects.toThrow('not found');
      });
    });

    describe('positive cases', () => {
      it('calls service remove and returns void', async () => {
        service.remove.mockResolvedValue(undefined);

        await expect(controller.remove('todo-1')).resolves.toBeUndefined();
        expect(service.remove).toHaveBeenCalledWith('todo-1');
      });
    });
  });

  describe('update', () => {
    describe('negative cases', () => {
      it('propagates service error', async () => {
        service.update.mockRejectedValue(new Error('db error'));

        await expect(controller.update('todo-1', { title: 'New' })).rejects.toThrow('db error');
      });
    });

    describe('positive cases', () => {
      it('updates and returns todo DTO', async () => {
        const updated = { ...todoData, title: 'Updated' };
        service.update.mockResolvedValue(updated);

        const result = await controller.update('todo-1', { title: 'Updated' });

        expect(result).toBeInstanceOf(TodoResponseDto);
        expect(service.update).toHaveBeenCalledWith('todo-1', { title: 'Updated' });
      });
    });
  });
});
