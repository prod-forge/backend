import request from 'supertest';

import { TodoEntity } from '../src/features/todos/entities/todo.entity';
import { PaginatedEntity } from '../src/shared/entities/paginated.entity';
import { server } from './setup/bootstrap.app';
import { authHeaders } from './utils/request.headers';

describe('Todos API (e2e)', () => {
  beforeAll(async () => {
    await request(server).post('/api/v1/todos').set(authHeaders).send({ description: 'test', title: 'B todo' });
    await request(server)
      .post('/api/v1/todos')
      .set(authHeaders)
      .send({ completed: true, description: 'test', title: 'A todo' });
    await request(server).post('/api/v1/todos').set(authHeaders).send({ description: 'test', title: 'C todo' });
  });

  describe('Negative Cases', () => {
    it('should raise user is not authorized error', async () => {
      await request(server).post('/api/v1/todos').send({}).expect(401);
    });
    it('should raise validation error (title not found)', async () => {
      await request(server).post('/api/v1/todos').set(authHeaders).send({}).expect(422);
    });

    it('should raise error (todo is not found)', async () => {
      await request(server).get('/api/v1/todos/999').set(authHeaders).expect(400);
    });
  });

  describe('Positive Cases', () => {
    it('should return filtered todos by completed=true', async () => {
      const res = await request(server).get('/api/v1/todos?completed=true').set(authHeaders).expect(200);

      const { data } = res.body as PaginatedEntity<TodoEntity>;

      expect(data.length).toBe(1);
      expect(data[0].completed).toBe(true);
    });

    it('should return sorted todos sortBy=title&order=asc', async () => {
      const res = await request(server).get('/api/v1/todos?sortBy=title&order=asc').set(authHeaders).expect(200);

      const { data } = res.body as PaginatedEntity<TodoEntity>;

      expect(data.map((i) => i.title)).toEqual(['A todo', 'B todo', 'C todo']);
    });

    it('should return paginated todos offset=2&limit=1', async () => {
      const res = await request(server).get('/api/v1/todos?offset=2&limit=1').set(authHeaders).expect(200);

      const { data, meta } = res.body as PaginatedEntity<TodoEntity>;

      expect(data.length).toBe(1);
      expect(meta.total).toBe(3);
    });
  });
});
