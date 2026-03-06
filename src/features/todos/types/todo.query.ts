import { SortOrder, TodoSortField } from '../interfaces/queries.enum';

export interface TodoFilter {
  completed?: boolean;
  search?: string;
}

export interface TodoPagination {
  limit: number;
  offset: number;
}

export interface TodoSort {
  order: SortOrder;
  sortBy: TodoSortField;
}
