import type { TodosQueryDto } from '../../../api/todos/dtos/queries/todos-query.dto';

// Bump when the shape or meaning of a cached value changes: during a rolling deploy old and new tasks share Redis,
// and a new prefix keeps each version reading only the entries it wrote. v2: todo entries carry userId, lists use offsets.
const CACHE_VERSION = 'v2';

export const TodosCacheKeys = {
  todo(id: string): string {
    return `${CACHE_VERSION}:todo:${id}`;
  },

  todos(userId: string, query: TodosQueryDto): string {
    return `${CACHE_VERSION}:todos:${userId}:${Buffer.from(JSON.stringify(query)).toString('base64')}`;
  },

  todosByUser(userId: string): string {
    return `${CACHE_VERSION}:todos:${userId}:*`;
  },
};
