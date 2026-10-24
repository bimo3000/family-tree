import { describe, expect, it } from 'vitest';
import { createProject, newId } from '../../src/core/model/project';

describe('newId', () => {
  it('is prefixed and unique', () => {
    const ids = new Set(Array.from({ length: 100 }, () => newId('p')));
    expect(ids.size).toBe(100);
    for (const id of ids) expect(id).toMatch(/^p_[0-9a-f-]{36}$/);
  });
});

describe('createProject', () => {
  it('starts empty with both timestamps set', () => {
    const project = createProject('Familie Müller', new Date('2026-10-24T10:00:00Z'));
    expect(project).toMatchObject({
      name: 'Familie Müller',
      createdAt: '2026-10-24T10:00:00.000Z',
      modifiedAt: '2026-10-24T10:00:00.000Z',
      persons: [],
      partnerships: [],
      parentChild: [],
      images: [],
    });
    expect(project.id).not.toBe(createProject('x', new Date()).id);
  });
});
