export class TodoEntity {
  completed: boolean;
  description: null | string;
  id: string;
  title: string;

  constructor(partial: Partial<TodoEntity>) {
    Object.assign(this, partial);
  }
}
