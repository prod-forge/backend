import type { TodosQueryDto } from '../../../api/todos/dtos/queries/todos-query.dto';

export const TodosCacheKeys = {
  todo(id: string): string {
    return `todo:${id}`;
  },

  todos(userId: string, query: TodosQueryDto): string {
    return `todos:${userId}:${Buffer.from(JSON.stringify(query)).toString('base64')}`;
  },

  todosByUser(userId: string): string {
    return `todos:${userId}:*`;
  },
};
