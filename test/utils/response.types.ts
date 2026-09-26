export type DataBody<T> = {
  data: T;
};

export type ErrorBody = {
  code: string;
  details?: Record<string, unknown>;
  status: number;
};

export type ListBody<T> = {
  data: T[];
  meta: {
    limit: number;
    offset: number;
    total: number;
  };
};

export type TodoItem = {
  completed: boolean;
  description?: string;
  id: string;
  title: string;
};
