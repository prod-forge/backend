import type { TodosQueryDto } from '../../../api/todos/dtos/queries/todos-query.dto';

import { SortOrder, TodoSortField } from '../interfaces/queries.enum';
import { TodosCacheKeys } from './todos.cache-queries';

describe('TodosCacheKeys', () => {
  describe('todo', () => {
    describe('positive cases', () => {
      it('returns a key prefixed with "todo:"', () => {
        expect(TodosCacheKeys.todo('abc-123')).toBe('todo:abc-123');
      });

      it('returns unique keys for different ids', () => {
        expect(TodosCacheKeys.todo('id-1')).not.toBe(TodosCacheKeys.todo('id-2'));
      });
    });
  });

  describe('todos', () => {
    describe('positive cases', () => {
      it('returns a key prefixed with "todos:<userId>:"', () => {
        const key = TodosCacheKeys.todos('user-1', {});

        expect(key).toMatch(/^todos:user-1:/);
      });

      it('encodes query as base64', () => {
        const query: TodosQueryDto = { order: SortOrder.DESC, sortBy: TodoSortField.TITLE };
        const key = TodosCacheKeys.todos('user-1', query);
        const encoded = key.split(':').at(-1) ?? '';
        const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString()) as Record<string, string>;

        expect(decoded).toEqual(query);
      });

      it('returns different keys for different queries', () => {
        const key1 = TodosCacheKeys.todos('user-1', { limit: 10 });
        const key2 = TodosCacheKeys.todos('user-1', { limit: 20 });

        expect(key1).not.toBe(key2);
      });

      it('returns different keys for different users with same query', () => {
        const query: TodosQueryDto = {};
        const key1 = TodosCacheKeys.todos('user-1', query);
        const key2 = TodosCacheKeys.todos('user-2', query);

        expect(key1).not.toBe(key2);
      });

      it('returns same key for identical userId and query', () => {
        const query: TodosQueryDto = { limit: 5 };

        expect(TodosCacheKeys.todos('user-1', query)).toBe(TodosCacheKeys.todos('user-1', query));
      });
    });
  });

  describe('todosByUser', () => {
    describe('positive cases', () => {
      it('returns a wildcard pattern for the user', () => {
        expect(TodosCacheKeys.todosByUser('user-1')).toBe('todos:user-1:*');
      });

      it('returns different patterns for different users', () => {
        expect(TodosCacheKeys.todosByUser('user-1')).not.toBe(TodosCacheKeys.todosByUser('user-2'));
      });
    });
  });
});
