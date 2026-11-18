import type { TransformFnParams } from 'class-transformer';

import { parseBooleanEnv } from './booleans';

describe('parseBooleanEnv', () => {
  const parse = (raw: string): unknown => parseBooleanEnv({ key: 'FLAG', obj: { FLAG: raw } } as TransformFnParams);

  describe('negative cases', () => {
    it.each(['TRUE', 'FALSE', '0', '1', '', 'maybe'])(
      'returns %j as is, so the boolean validator can reject it',
      (raw) => {
        expect(parse(raw)).toBe(raw);
      },
    );
  });

  describe('positive cases', () => {
    it('parses "true"', () => {
      expect(parse('true')).toBe(true);
    });

    it('parses "false"', () => {
      expect(parse('false')).toBe(false);
    });
  });
});
