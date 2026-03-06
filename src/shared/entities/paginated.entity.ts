export class PaginatedEntity<T> {
  data: T[];
  meta: {
    limit: number;
    offset: number;
    total: number;
  };

  constructor({ items, limit, offset, total }: { items: T[]; limit: number; offset: number; total: number }) {
    this.data = items;

    this.meta = {
      limit,
      offset,
      total,
    };
  }
}
