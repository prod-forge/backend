import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { LoginDto } from './login.dto';

const makeDto = (body: Record<string, unknown>): LoginDto => plainToInstance(LoginDto, body);

describe('LoginDto', () => {
  describe('negative cases', () => {
    it('rejects an invalid email', async () => {
      const errors = await validate(makeDto({ email: ' Not-An-Email ' }));

      expect(errors.map((error) => error.property)).toEqual(['email']);
    });

    it('rejects a whitespace-only email', async () => {
      const errors = await validate(makeDto({ email: '   ' }));

      expect(errors.map((error) => error.property)).toEqual(['email']);
    });

    it('rejects a non-string email', async () => {
      const errors = await validate(makeDto({ email: 123 }));

      expect(errors.map((error) => error.property)).toEqual(['email']);
    });
  });

  describe('positive cases', () => {
    it('lowercases a mixed-case email', async () => {
      const dto = makeDto({ email: 'User1@Example.com' });

      expect(await validate(dto)).toHaveLength(0);
      expect(dto.email).toBe('user1@example.com');
    });

    it('trims the surrounding whitespace', async () => {
      const dto = makeDto({ email: ' user1@example.com ' });

      expect(await validate(dto)).toHaveLength(0);
      expect(dto.email).toBe('user1@example.com');
    });
  });
});
