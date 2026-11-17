import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateTodoDto } from './create-todo.dto';
import { UpdateTodoDto } from './update-todo.dto';

describe('CreateTodoDto', () => {
  describe('negative cases', () => {
    it.each(['title', 'completed'] as const)(
      'rejects null for %s (would reach Prisma as a 500)',
      async (field) => {
        const dto = plainToInstance(CreateTodoDto, {
          title: 'x',
          ...(field === 'title' ? { title: null } : { completed: null }),
        });

        expect(await validate(dto)).not.toHaveLength(0);
      },
    );
  });

  describe('positive cases', () => {
    it('accepts a valid create body', async () => {
      const dto = plainToInstance(CreateTodoDto, { title: 'x', completed: false });

      expect(await validate(dto)).toHaveLength(0);
    });

    it('accepts null for the nullable description', async () => {
      const dto = plainToInstance(CreateTodoDto, {
        title: 'x',
        description: null,
      });

      expect(await validate(dto)).toHaveLength(0);
    });
  });
});

describe('UpdateTodoDto', () => {
  describe('negative cases', () => {
    it.each(['title', 'completed'] as const)(
      'rejects null for %s on PATCH',
      async (field) => {
        const dto = plainToInstance(UpdateTodoDto, { [field]: null });

        expect(await validate(dto)).not.toHaveLength(0);
      },
    );
  });

  describe('positive cases', () => {
    it('accepts omitted fields (undefined)', async () => {
      const dto = plainToInstance(UpdateTodoDto, {});

      expect(await validate(dto)).toHaveLength(0);
    });

    it('accepts null for the nullable description on PATCH', async () => {
      const dto = plainToInstance(UpdateTodoDto, { description: null });

      expect(await validate(dto)).toHaveLength(0);
    });
  });
});
