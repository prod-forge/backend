import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateTodoDto } from './update-todo.dto';

const makeDto = (body: Record<string, unknown>): UpdateTodoDto => plainToInstance(UpdateTodoDto, body);

describe('UpdateTodoDto', () => {
  describe('negative cases', () => {
    it('does not add completed when the body leaves it out', async () => {
      const dto = makeDto({ title: 'Renamed' });

      expect(await validate(dto)).toHaveLength(0);
      expect(dto).not.toHaveProperty('completed');
    });

    it('rejects a non-boolean completed value', async () => {
      const errors = await validate(makeDto({ completed: 'yes' }));

      expect(errors).not.toHaveLength(0);
    });

    it.each(['title', 'completed'])('rejects null for %s', async (field) => {
      const errors = await validate(makeDto({ [field]: null }));

      expect(errors.map((error) => error.property)).toEqual([field]);
    });
  });

  describe('positive cases', () => {
    it('keeps completed when the body sets it', async () => {
      const dto = makeDto({ completed: true });

      expect(await validate(dto)).toHaveLength(0);
      expect(dto.completed).toBe(true);
    });

    it('keeps only the fields the body sets', async () => {
      const dto = makeDto({ description: 'New description' });

      expect(await validate(dto)).toHaveLength(0);
      expect(Object.keys(dto)).toEqual(['description']);
    });

    it('allows null for description, which is nullable', async () => {
      expect(await validate(makeDto({ description: null }))).toHaveLength(0);
    });
  });
});
