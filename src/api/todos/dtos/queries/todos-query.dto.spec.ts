import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { TodosQueryDto } from './todos-query.dto';

const makeDto = (query: Record<string, unknown> = {}): TodosQueryDto => plainToInstance(TodosQueryDto, query);

describe('TodosQueryDto', () => {
  describe('negative cases', () => {
    it('rejects completed=yes', async () => {
      const errors = await validate(makeDto({ completed: 'yes' }));

      expect(errors).not.toHaveLength(0);
    });

    it('rejects completed=1', async () => {
      const errors = await validate(makeDto({ completed: '1' }));

      expect(errors).not.toHaveLength(0);
    });

    it('rejects an empty completed value', async () => {
      const errors = await validate(makeDto({ completed: '' }));

      expect(errors).not.toHaveLength(0);
    });
  });

  describe('positive cases', () => {
    it('maps completed=true to true', async () => {
      const dto = makeDto({ completed: 'true' });

      expect(await validate(dto)).toHaveLength(0);
      expect(dto.completed).toBe(true);
    });

    it('maps completed=false to false', async () => {
      const dto = makeDto({ completed: 'false' });

      expect(await validate(dto)).toHaveLength(0);
      expect(dto.completed).toBe(false);
    });

    it('leaves completed undefined when it is absent', async () => {
      const dto = makeDto();

      expect(await validate(dto)).toHaveLength(0);
      expect(dto.completed).toBeUndefined();
    });
  });
});
