import type { TodoEntity } from './todo.entity';

import { PaginatedEntity } from '../../../shared/entities/paginated.entity';

type TodosPageArgs = ConstructorParameters<typeof PaginatedEntity<TodoEntity>>[0] & { completed: number };

export class TodosPageEntity extends PaginatedEntity<TodoEntity> {
  declare meta: PaginatedEntity<TodoEntity>['meta'] & { completed: number };

  constructor({ completed, ...page }: TodosPageArgs) {
    super(page);

    this.meta = { ...this.meta, completed };
  }
}
