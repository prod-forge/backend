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
