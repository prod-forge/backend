import type { SortOrder, TodoSortField } from '../interfaces/queries.enum';

export type TodoFilter = {
  completed?: boolean;
  search?: string;
};

export type TodoPagination = {
  limit: number;
  offset: number;
};

export type TodoSort = {
  order: SortOrder;
  sortBy?: TodoSortField;
};
