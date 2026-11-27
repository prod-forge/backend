import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { createOpenApiDocument } from '../src/app.openapi';
import { app } from './setup/bootstrap.app';

describe('OpenAPI contract (e2e)', () => {
  describe('negative cases', () => {
    it('does not document health and metrics routes under the API prefix', () => {
      const paths = Object.keys(createOpenApiDocument(app).paths);

      expect(paths.filter((path) => /^\/api\/(?:health|metrics)/.test(path))).toEqual([]);
    });
  });

  describe('positive cases', () => {
    it('documents the todo id path parameter as a UUID', () => {
      const pathItem = createOpenApiDocument(app).paths['/api/v1/todos/{id}'];

      for (const method of ['get', 'patch', 'delete'] as const) {
        const parameters = pathItem[method]?.parameters ?? [];
        const idParam = parameters.find((parameter) => 'name' in parameter && parameter.name === 'id');

        expect(idParam).toMatchObject({
          description: 'id must be a valid UUID. A malformed value returns DTO_VALIDATION_ERROR 422.',
          in: 'path',
          name: 'id',
          required: true,
          schema: { format: 'uuid', type: 'string' },
        });
      }
    });

    it('matches the committed docs/openapi.json', async () => {
      const committed: unknown = JSON.parse(await readFile(join(process.cwd(), 'docs', 'openapi.json'), 'utf8'));
      const generated: unknown = createOpenApiDocument(app);

      if (JSON.stringify(generated) !== JSON.stringify(committed)) {
        // Surface the hint next to the jest diff
        // eslint-disable-next-line no-console
        console.error('docs/openapi.json is out of date: run npm run openapi:export and commit the result');
      }

      expect(generated).toEqual(committed);
    });
  });
});
