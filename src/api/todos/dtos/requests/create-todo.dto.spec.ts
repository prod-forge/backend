import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateTodoDto } from './create-todo.dto';

const makeDto = (body: Record<string, unknown>): CreateTodoDto => plainToInstance(CreateTodoDto, body);

describe('CreateTodoDto', () => {
  describe('negative cases', () => {
    it('rejects null for title', async () => {
      const errors = await validate(makeDto({ title: null }));

      expect(errors.map((error) => error.property)).toEqual(['title']);
    });

    it('rejects null for completed', async () => {
      const errors = await validate(makeDto({ completed: null, title: 'Buy milk' }));

      expect(errors.map((error) => error.property)).toEqual(['completed']);
    });

    it.each(['', '   '])('rejects empty or whitespace-only title %j', async (title) => {
      const errors = await validate(makeDto({ title }));

      expect(errors.map((error) => error.property)).toEqual(['title']);
    });
  });

  describe('positive cases', () => {
    it('trims surrounding whitespace on title', async () => {
      const dto = makeDto({ title: '  Buy milk  ' });

      expect(await validate(dto)).toHaveLength(0);
      expect(dto.title).toBe('Buy milk');
    });
    it('accepts a body without completed', async () => {
      expect(await validate(makeDto({ title: 'Buy milk' }))).toHaveLength(0);
    });

    it('accepts a boolean completed', async () => {
      expect(await validate(makeDto({ completed: true, title: 'Buy milk' }))).toHaveLength(0);
    });

    it('allows null for description, which is nullable', async () => {
      expect(await validate(makeDto({ description: null, title: 'Buy milk' }))).toHaveLength(0);
    });
  });
});
