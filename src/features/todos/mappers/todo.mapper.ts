import type { Todo } from '../../../../database-manager/generated/client';

import { TodoEntity } from '../entities/todo.entity';

export const TodoMapper = {
  toEntity(todo: Todo): TodoEntity {
    return new TodoEntity({
      completed: todo.completed,
      description: todo.description,
      id: todo.id,
      title: todo.title,
    });
  },
};
