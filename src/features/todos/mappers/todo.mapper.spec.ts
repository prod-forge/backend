import type { Todo } from '../../../../database-manager/generated/client';

import { TodoEntity } from '../entities/todo.entity';
import { TodoMapper } from './todo.mapper';

describe('TodoMapper', () => {
  describe('toEntity', () => {
    describe('negative cases', () => {
      it('does not copy fields that are not part of the entity', () => {
        const todo = {
          completed: false,
          createdAt: new Date(),
          description: null,
          id: 'todo-1',
          title: 'Test',
          userId: 'u1',
        } as unknown as Todo;

        const result = TodoMapper.toEntity(todo);

        expect(result.userId).toBe('u1');
        expect(result).not.toHaveProperty('createdAt');
      });
    });

    describe('positive cases', () => {
      it('maps all fields from a todo record to TodoEntity', () => {
        const todo = { completed: true, description: 'Oat milk', id: 'todo-1', title: 'Buy milk' } as unknown as Todo;

        const result = TodoMapper.toEntity(todo);

        expect(result).toBeInstanceOf(TodoEntity);
        expect(result.id).toBe('todo-1');
        expect(result.title).toBe('Buy milk');
        expect(result.completed).toBe(true);
        expect(result.description).toBe('Oat milk');
      });

      it('maps null description correctly', () => {
        const todo = { completed: false, description: null, id: 'todo-1', title: 'Test' } as unknown as Todo;

        const result = TodoMapper.toEntity(todo);

        expect(result.description).toBeNull();
      });

      it('maps completed=false correctly', () => {
        const todo = { completed: false, description: null, id: 'todo-2', title: 'Task' } as unknown as Todo;

        const result = TodoMapper.toEntity(todo);

        expect(result.completed).toBe(false);
      });
    });
  });
});
