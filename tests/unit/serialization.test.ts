import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, migrate, type Migration } from '../../src/core/migrations';
import { findPerson } from '../../src/core/model/queries';
import { FILE_FORMAT, projectFromJson, projectToJson } from '../../src/core/serialization';
import { familieBrandt } from '../fixtures/familie-brandt';
import { expectCode } from './helpers';

const json = (value: unknown) => JSON.stringify(value);
const brandtFile = () =>
  JSON.parse(projectToJson(familieBrandt, '0.1.0')) as Record<string, unknown>;

describe('projectToJson', () => {
  it('writes the file-level fields first, then the project', () => {
    const file = brandtFile();
    expect(Object.keys(file).slice(0, 4)).toEqual([
      'format',
      'schemaVersion',
      'savedWithAppVersion',
      'id',
    ]);
    expect(file).toMatchObject({
      format: FILE_FORMAT,
      schemaVersion: 1,
      savedWithAppVersion: '0.1.0',
    });
  });

  it('is readable JSON with indentation (DATA-05)', () => {
    expect(projectToJson(familieBrandt, '0.1.0')).toContain('\n  "persons": [');
  });
});

describe('projectFromJson', () => {
  it('round-trips the example family unchanged', () => {
    expect(projectFromJson(projectToJson(familieBrandt, '0.1.0'))).toEqual(familieBrandt);
  });

  it('opens the stored schema version 1 sample (DATA-08)', () => {
    const project = projectFromJson(
      readFileSync(new URL('../fixtures/schema-v1.json', import.meta.url), 'utf8'),
    );
    expect(project.name).toBe('Familie Müller');
    expect(findPerson(project, 'p_anna')?.birth?.date).toEqual({ y: 1923, m: 3, d: 12 });
    expect(project.images).toHaveLength(1);
    expect(project.view).toEqual({ focusPersonId: 'p_anna' });
    expect(project).not.toHaveProperty('format');
    expect(project).not.toHaveProperty('schemaVersion');
    expect(project).not.toHaveProperty('savedWithAppVersion');
  });

  it('refuses a file from a newer app version', () => {
    expectCode(
      () => projectFromJson(json({ ...brandtFile(), schemaVersion: CURRENT_SCHEMA_VERSION + 1 })),
      'newer-version',
    );
  });

  it.each([
    ['another JSON file', json({ name: 'package', version: '1.0.0' })],
    ['a JSON array', json([1, 2])],
    ['another format', json({ format: 'gedcom', schemaVersion: 1 })],
  ])('refuses %s as not a project', (_, text) => {
    expectCode(() => projectFromJson(text), 'not-a-project');
  });

  it.each<[string, () => string]>([
    ['broken JSON', () => projectToJson(familieBrandt, '0.1.0').slice(0, 200)],
    ['a missing schema version', () => json({ ...brandtFile(), schemaVersion: undefined })],
    ['schema version 0', () => json({ ...brandtFile(), schemaVersion: 0 })],
    ['a missing person list', () => json({ ...brandtFile(), persons: undefined })],
    ['a person without ID', () => json({ ...brandtFile(), persons: [{ givenNames: 'Anna' }] })],
    [
      'a partnership with one partner',
      () => json({ ...brandtFile(), partnerships: [{ id: 'u_1', partners: ['p_karl'] }] }),
    ],
    [
      'a link to a missing person',
      () => json({ ...brandtFile(), parentChild: [{ parentId: 'p_x', childId: 'p_karl' }] }),
    ],
    ['a missing project name', () => json({ ...brandtFile(), name: 7 })],
  ])('refuses %s as invalid', (_, text) => {
    expectCode(() => projectFromJson(text()), 'invalid');
  });
});

describe('migrate', () => {
  const file = { schemaVersion: 1, name: 'Familie' };

  it('does nothing for the current version', () => {
    expect(migrate(file)).toEqual(file);
  });

  it('runs every step in order up to the target version', () => {
    const steps: Record<number, Migration> = {
      1: (d) => ({ ...d, title: d.name }),
      2: (d) => ({ ...d, title: `${String(d.title)}!` }),
    };
    expect(migrate(file, steps, 3)).toEqual({
      schemaVersion: 3,
      name: 'Familie',
      title: 'Familie!',
    });
  });

  it('fails cleanly when a step is missing', () => {
    expectCode(() => migrate(file, {}, 2), 'invalid');
  });
});
