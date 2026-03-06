import { TodosQueryDto } from '../../../api/todos/dtos/queries/todos-query.dto';

export class TodosCacheKeys {
  static todo(id: string): string {
    return `todo:${id}`;
  }

  static todos(userId: string, query: TodosQueryDto): string {
    return `todos:${userId}:${Buffer.from(JSON.stringify(query)).toString('base64')}`;
  }

  static todosByUser(userId: string): string {
    return `todos:${userId}:*`;
  }
}
