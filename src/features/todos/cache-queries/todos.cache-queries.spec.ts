import type { TodosQueryDto } from '../../../api/todos/dtos/queries/todos-query.dto';

import { SortOrder, TodoSortField } from '../interfaces/queries.enum';
import { TodosCacheKeys } from './todos.cache-queries';

describe('TodosCacheKeys', () => {
  describe('todo', () => {
    describe('negative cases', () => {
      it('is never matched by a list invalidation pattern', () => {
        const pattern = TodosCacheKeys.todosByUser('abc-123');

        expect(TodosCacheKeys.todo('abc-123').startsWith(pattern.slice(0, -1))).toBe(false);
      });
    });

    describe('positive cases', () => {
      it('returns a versioned key prefixed with "v2:todo:"', () => {
        expect(TodosCacheKeys.todo('abc-123')).toBe('v2:todo:abc-123');
      });

      it('returns unique keys for different ids', () => {
        expect(TodosCacheKeys.todo('id-1')).not.toBe(TodosCacheKeys.todo('id-2'));
      });
    });
  });

  describe('todos', () => {
    describe('negative cases', () => {
      it('is not matched by the pattern of a user whose id is a prefix of it', () => {
        const pattern = TodosCacheKeys.todosByUser('user-1');

        expect(TodosCacheKeys.todos('user-10', {}).startsWith(pattern.slice(0, -1))).toBe(false);
      });
    });

    describe('positive cases', () => {
      it('returns a versioned key prefixed with "v2:todos:<userId>:"', () => {
        const key = TodosCacheKeys.todos('user-1', {});

        expect(key).toMatch(/^v2:todos:user-1:/);
      });

      it('is matched by the todosByUser pattern of the same user', () => {
        const pattern = TodosCacheKeys.todosByUser('user-1');

        expect(TodosCacheKeys.todos('user-1', { limit: 5 }).startsWith(pattern.slice(0, -1))).toBe(true);
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
    describe('negative cases', () => {
      it('does not cover the keys of another user', () => {
        const pattern = TodosCacheKeys.todosByUser('user-2');

        expect(TodosCacheKeys.todos('user-1', {}).startsWith(pattern.slice(0, -1))).toBe(false);
      });
    });

    describe('positive cases', () => {
      it('returns a wildcard pattern for the user', () => {
        expect(TodosCacheKeys.todosByUser('user-1')).toBe('v2:todos:user-1:*');
      });

      it('returns different patterns for different users', () => {
        expect(TodosCacheKeys.todosByUser('user-1')).not.toBe(TodosCacheKeys.todosByUser('user-2'));
      });
    });
  });
});
