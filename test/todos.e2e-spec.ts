import request from 'supertest';

import { server } from './setup/bootstrap.app';
import { authHeaders } from './utils/request.headers';
import { type DataBody, type ErrorBody, type ListBody, type TodoItem } from './utils/response.types';

const TODOS_URL = '/api/v1/todos';
const NON_EXISTENT_UUID = '00000000-0000-0000-0000-000000000000';
const INVALID_ID = 'not-a-uuid';

describe('Todos API (e2e)', () => {
  let todoAId: string;
  let todoBId: string;
  let todoCId: string;

  beforeAll(async () => {
    const [resA, resB, resC] = await Promise.all([
      request(server)
        .post(TODOS_URL)
        .set(authHeaders)
        .send({ completed: true, description: 'desc A', title: 'A todo' }),
      request(server).post(TODOS_URL).set(authHeaders).send({ description: 'desc B', title: 'B todo' }),
      request(server).post(TODOS_URL).set(authHeaders).send({ description: 'desc C', title: 'C todo' }),
    ]);

    todoAId = (resA.body as DataBody<TodoItem>).data.id;
    todoBId = (resB.body as DataBody<TodoItem>).data.id;
    todoCId = (resC.body as DataBody<TodoItem>).data.id;
  });

  describe('GET /api/v1/todos', () => {
    describe('negative cases', () => {
      it('returns 401 when no Authorization header is provided', async () => {
        const res = await request(server).get(TODOS_URL).expect(401);
        const body = res.body as ErrorBody;

        expect(body.code).toBe('USER_IS_NOT_AUTHORIZED');
        expect(body.status).toBe(401);
      });

      it('returns 422 when limit is below minimum', async () => {
        const res = await request(server).get(`${TODOS_URL}?limit=0`).set(authHeaders).expect(422);
        const body = res.body as ErrorBody;

        expect(body.code).toBe('DTO_VALIDATION_ERROR');
        expect(body.details).toHaveProperty('limit');
      });

      it('returns 422 when order is an invalid enum value', async () => {
        const res = await request(server).get(`${TODOS_URL}?order=invalid`).set(authHeaders).expect(422);
        const body = res.body as ErrorBody;

        expect(body.code).toBe('DTO_VALIDATION_ERROR');
        expect(body.details).toHaveProperty('order');
      });

      it('returns 422 when sortBy is an invalid enum value', async () => {
        const res = await request(server).get(`${TODOS_URL}?sortBy=invalid`).set(authHeaders).expect(422);
        const body = res.body as ErrorBody;

        expect(body.code).toBe('DTO_VALIDATION_ERROR');
        expect(body.details).toHaveProperty('sortBy');
      });
    });

    describe('positive cases', () => {
      it('returns a paginated response with data array and meta', async () => {
        const res = await request(server).get(TODOS_URL).set(authHeaders).expect(200);
        const body = res.body as ListBody<TodoItem>;

        expect(Array.isArray(body.data)).toBe(true);
        expect(body.meta).toMatchObject({
          limit: expect.any(Number) as number,
          offset: expect.any(Number) as number,
          total: expect.any(Number) as number,
        });
      });

      it('returns only completed todos when completed=true', async () => {
        const res = await request(server).get(`${TODOS_URL}?completed=true`).set(authHeaders).expect(200);
        const body = res.body as ListBody<TodoItem>;

        expect(body.data.length).toBeGreaterThanOrEqual(1);
        expect(body.data.every((t) => t.completed)).toBe(true);
      });

      it('returns only incomplete todos when completed=false', async () => {
        const res = await request(server).get(`${TODOS_URL}?completed=false`).set(authHeaders).expect(200);
        const body = res.body as ListBody<TodoItem>;

        expect(body.data.length).toBeGreaterThanOrEqual(1);
        expect(body.data.every((t) => !t.completed)).toBe(true);
      });

      it('returns todos sorted by title ascending', async () => {
        const res = await request(server).get(`${TODOS_URL}?sortBy=title&order=asc`).set(authHeaders).expect(200);
        const body = res.body as ListBody<TodoItem>;

        const titles = body.data.map((t) => t.title);

        expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
      });

      it('returns todos sorted by title descending', async () => {
        const res = await request(server).get(`${TODOS_URL}?sortBy=title&order=desc`).set(authHeaders).expect(200);
        const body = res.body as ListBody<TodoItem>;

        const titles = body.data.map((t) => t.title);

        expect(titles).toEqual([...titles].sort((a, b) => b.localeCompare(a)));
      });

      it('returns only matching todos when searching by title', async () => {
        const res = await request(server).get(`${TODOS_URL}?search=A todo`).set(authHeaders).expect(200);
        const body = res.body as ListBody<TodoItem>;

        expect(body.data.some((t) => t.title === 'A todo')).toBe(true);
      });

      it('returns only matching todos when searching by description', async () => {
        const res = await request(server)
          .get(`${TODOS_URL}?search=desc B&searchField=description`)
          .set(authHeaders)
          .expect(200);
        const body = res.body as ListBody<TodoItem>;

        expect(body.data.some((t) => t.description === 'desc B')).toBe(true);
      });

      it('respects limit and returns correct number of items', async () => {
        const res = await request(server).get(`${TODOS_URL}?limit=1&offset=1`).set(authHeaders).expect(200);
        const body = res.body as ListBody<TodoItem>;

        expect(body.data).toHaveLength(1);
        expect(body.meta.limit).toBe(1);
        expect(body.meta.offset).toBe(1);
      });

      it('total count is consistent across paginated requests', async () => {
        const [page1, page2] = await Promise.all([
          request(server).get(`${TODOS_URL}?limit=1&offset=1`).set(authHeaders),
          request(server).get(`${TODOS_URL}?limit=1&offset=2`).set(authHeaders),
        ]);

        expect((page1.body as ListBody<TodoItem>).meta.total).toBe((page2.body as ListBody<TodoItem>).meta.total);
      });
    });
  });

  describe('GET /api/v1/todos/:id', () => {
    describe('negative cases', () => {
      it('returns 401 when no Authorization header is provided', async () => {
        const res = await request(server).get(`${TODOS_URL}/${todoAId}`).expect(401);
        const body = res.body as ErrorBody;

        expect(body.code).toBe('USER_IS_NOT_AUTHORIZED');
      });

      it('returns 400 when id is not a valid UUID format', async () => {
        await request(server).get(`${TODOS_URL}/${INVALID_ID}`).set(authHeaders).expect(400);
      });

      it('returns 404 with TODO_NOT_FOUND code when todo does not exist', async () => {
        const res = await request(server).get(`${TODOS_URL}/${NON_EXISTENT_UUID}`).set(authHeaders).expect(404);
        const body = res.body as ErrorBody;

        expect(body.code).toBe('TODO_NOT_FOUND');
        expect(body.status).toBe(404);
      });
    });

    describe('positive cases', () => {
      it('returns the todo entity wrapped in data', async () => {
        const res = await request(server).get(`${TODOS_URL}/${todoAId}`).set(authHeaders).expect(200);
        const body = res.body as DataBody<TodoItem>;

        expect(body.data).toMatchObject({
          completed: true,
          description: 'desc A',
          id: todoAId,
          title: 'A todo',
        });
      });

      it('returns different todos for different ids', async () => {
        const [resA, resB] = await Promise.all([
          request(server).get(`${TODOS_URL}/${todoAId}`).set(authHeaders),
          request(server).get(`${TODOS_URL}/${todoBId}`).set(authHeaders),
        ]);

        expect((resA.body as DataBody<TodoItem>).data.id).toBe(todoAId);
        expect((resB.body as DataBody<TodoItem>).data.id).toBe(todoBId);
      });
    });
  });

  describe('POST /api/v1/todos', () => {
    describe('negative cases', () => {
      it('returns 401 when no Authorization header is provided', async () => {
        const res = await request(server).post(TODOS_URL).send({ title: 'New Todo' }).expect(401);
        const body = res.body as ErrorBody;

        expect(body.code).toBe('USER_IS_NOT_AUTHORIZED');
      });

      it('returns 422 when title is missing', async () => {
        const res = await request(server).post(TODOS_URL).set(authHeaders).send({}).expect(422);
        const body = res.body as ErrorBody;

        expect(body.code).toBe('DTO_VALIDATION_ERROR');
        expect(body.details).toHaveProperty('title');
      });

      it('returns 422 when title is not a string', async () => {
        const res = await request(server).post(TODOS_URL).set(authHeaders).send({ title: 123 }).expect(422);
        const body = res.body as ErrorBody;

        expect(body.code).toBe('DTO_VALIDATION_ERROR');
        expect(body.details).toHaveProperty('title');
      });

      it('returns 422 when completed is not a boolean', async () => {
        const res = await request(server)
          .post(TODOS_URL)
          .set(authHeaders)
          .send({ completed: 'yes', title: 'Test' })
          .expect(422);
        const body = res.body as ErrorBody;

        expect(body.code).toBe('DTO_VALIDATION_ERROR');
        expect(body.details).toHaveProperty('completed');
      });

      it('returns 422 when body contains a non-whitelisted field', async () => {
        const res = await request(server)
          .post(TODOS_URL)
          .set(authHeaders)
          .send({ title: 'Test', unknownField: 'value' })
          .expect(422);
        const body = res.body as ErrorBody;

        expect(body.code).toBe('DTO_VALIDATION_ERROR');
      });
    });

    describe('positive cases', () => {
      it('creates a todo with title only and returns 201', async () => {
        const res = await request(server).post(TODOS_URL).set(authHeaders).send({ title: 'Only Title' }).expect(201);
        const body = res.body as DataBody<TodoItem>;

        expect(body.data).toMatchObject({
          completed: false,
          title: 'Only Title',
        });
        expect(body.data.id).toBeDefined();
      });

      it('creates a todo with all optional fields', async () => {
        const res = await request(server)
          .post(TODOS_URL)
          .set(authHeaders)
          .send({ completed: true, description: 'A description', title: 'Full Todo' })
          .expect(201);
        const body = res.body as DataBody<TodoItem>;

        expect(body.data.completed).toBe(true);
        expect(body.data.description).toBe('A description');
        expect(body.data.title).toBe('Full Todo');
      });

      it('newly created todo is retrievable by id', async () => {
        const createRes = await request(server).post(TODOS_URL).set(authHeaders).send({ title: 'Retrievable Todo' });
        const id = (createRes.body as DataBody<TodoItem>).data.id;

        const getRes = await request(server).get(`${TODOS_URL}/${id}`).set(authHeaders).expect(200);
        const getBody = getRes.body as DataBody<TodoItem>;

        expect(getBody.data.id).toBe(id);
        expect(getBody.data.title).toBe('Retrievable Todo');
      });
    });
  });

  describe('PATCH /api/v1/todos/:id', () => {
    let patchTargetId: string;

    beforeAll(async () => {
      const res = await request(server)
        .post(TODOS_URL)
        .set(authHeaders)
        .send({ completed: false, title: 'Patch Target' });

      patchTargetId = (res.body as DataBody<TodoItem>).data.id;
    });

    describe('negative cases', () => {
      it('returns 401 when no Authorization header is provided', async () => {
        const res = await request(server).patch(`${TODOS_URL}/${NON_EXISTENT_UUID}`).send({ title: 'x' }).expect(401);
        const body = res.body as ErrorBody;

        expect(body.code).toBe('USER_IS_NOT_AUTHORIZED');
      });

      it('returns 404 when todo does not exist', async () => {
        const res = await request(server)
          .patch(`${TODOS_URL}/${NON_EXISTENT_UUID}`)
          .set(authHeaders)
          .send({ title: 'x' })
          .expect(404);
        const body = res.body as ErrorBody;

        expect(body.code).toBe('DATABASE_ERROR');
      });

      it('returns 422 when completed is not a boolean', async () => {
        const res = await request(server)
          .patch(`${TODOS_URL}/${patchTargetId}`)
          .set(authHeaders)
          .send({ completed: 'yes' })
          .expect(422);
        const body = res.body as ErrorBody;

        expect(body.code).toBe('DTO_VALIDATION_ERROR');
        expect(body.details).toHaveProperty('completed');
      });

      it('returns 422 when body contains a non-whitelisted field', async () => {
        const res = await request(server)
          .patch(`${TODOS_URL}/${patchTargetId}`)
          .set(authHeaders)
          .send({ unknownField: 'x' })
          .expect(422);
        const body = res.body as ErrorBody;

        expect(body.code).toBe('DTO_VALIDATION_ERROR');
      });
    });

    describe('positive cases', () => {
      it('updates the title and returns the updated entity', async () => {
        const res = await request(server)
          .patch(`${TODOS_URL}/${patchTargetId}`)
          .set(authHeaders)
          .send({ title: 'Updated Title' })
          .expect(200);
        const body = res.body as DataBody<TodoItem>;

        expect(body.data.title).toBe('Updated Title');
        expect(body.data.id).toBe(patchTargetId);
      });

      it('updates the completed flag to true', async () => {
        const res = await request(server)
          .patch(`${TODOS_URL}/${patchTargetId}`)
          .set(authHeaders)
          .send({ completed: true })
          .expect(200);
        const body = res.body as DataBody<TodoItem>;

        expect(body.data.completed).toBe(true);
      });

      it('updates the description field', async () => {
        const res = await request(server)
          .patch(`${TODOS_URL}/${patchTargetId}`)
          .set(authHeaders)
          .send({ description: 'New description' })
          .expect(200);
        const body = res.body as DataBody<TodoItem>;

        expect(body.data.description).toBe('New description');
      });

      it('persists the update — GET reflects the new value', async () => {
        await request(server).patch(`${TODOS_URL}/${todoCId}`).set(authHeaders).send({ title: 'C todo updated' });

        const getRes = await request(server).get(`${TODOS_URL}/${todoCId}`).set(authHeaders).expect(200);
        const getBody = getRes.body as DataBody<TodoItem>;

        expect(getBody.data.title).toBe('C todo updated');
      });
    });
  });

  describe('DELETE /api/v1/todos/:id', () => {
    describe('negative cases', () => {
      it('returns 401 when no Authorization header is provided', async () => {
        const res = await request(server).delete(`${TODOS_URL}/${NON_EXISTENT_UUID}`).expect(401);
        const body = res.body as ErrorBody;

        expect(body.code).toBe('USER_IS_NOT_AUTHORIZED');
      });

      it('returns 404 when todo does not exist', async () => {
        const res = await request(server).delete(`${TODOS_URL}/${NON_EXISTENT_UUID}`).set(authHeaders).expect(404);
        const body = res.body as ErrorBody;

        expect(body.code).toBe('TODO_NOT_FOUND');
      });
    });

    describe('positive cases', () => {
      it('deletes todo and returns 204 with no body', async () => {
        const createRes = await request(server).post(TODOS_URL).set(authHeaders).send({ title: 'To Delete' });
        const id = (createRes.body as DataBody<TodoItem>).data.id;

        const deleteRes = await request(server).delete(`${TODOS_URL}/${id}`).set(authHeaders).expect(204);

        expect(deleteRes.body).toEqual({});
      });

      it('deleted todo returns 404 on subsequent GET', async () => {
        const createRes = await request(server).post(TODOS_URL).set(authHeaders).send({ title: 'Delete Then Get' });
        const id = (createRes.body as DataBody<TodoItem>).data.id;

        await request(server).delete(`${TODOS_URL}/${id}`).set(authHeaders);

        await request(server).get(`${TODOS_URL}/${id}`).set(authHeaders).expect(404);
      });

      it('deleted todo is removed from the list', async () => {
        const createRes = await request(server).post(TODOS_URL).set(authHeaders).send({ title: 'Remove From List' });
        const id = (createRes.body as DataBody<TodoItem>).data.id;

        await request(server).delete(`${TODOS_URL}/${id}`).set(authHeaders);

        const listRes = await request(server).get(TODOS_URL).set(authHeaders);
        const ids = (listRes.body as ListBody<TodoItem>).data.map((t) => t.id);

        expect(ids).not.toContain(id);
      });
    });
  });
});
