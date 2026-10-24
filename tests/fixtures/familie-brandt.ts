// The fictional example family, read from the file the app embeds (examples/familie-brandt.json).
// Loading it through projectFromJson also proves that the shipped example is a valid project.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectFromJson } from '../../src/core/serialization';

export const familieBrandt = projectFromJson(
  readFileSync(resolve(import.meta.dirname, '../../examples/familie-brandt.json'), 'utf8'),
);
