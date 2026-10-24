import { describe, expect, it } from 'vitest';
import {
  addParentChild,
  addPartnership,
  addPerson,
  addUnknownParent,
  deletePerson,
  dropEmptyPlaceholders,
  removeParentChild,
  removePhoto,
  renameProject,
  removePartnership,
  setParentChildKind,
  setPhoto,
  updatePartnership,
  updatePerson,
} from '../../src/core/model/operations';
import { createProject } from '../../src/core/model/project';
import { findPerson, isPlaceholder, parentLinksOf } from '../../src/core/model/queries';
import { validateProject } from '../../src/core/model/validation';
import type { Project } from '../../src/core/model/types';
import { familieBrandt } from '../fixtures/familie-brandt';
import { expectCode } from './helpers';

/** Frozen, so any operation that modifies its input throws (ES modules run in strict mode). */
function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const v of Object.values(value)) deepFreeze(v);
    Object.freeze(value);
  }
  return value;
}

const brandt = deepFreeze(structuredClone(familieBrandt));
const empty = deepFreeze(createProject('Test', new Date('2026-10-24T10:00:00Z')));

describe('project', () => {
  it('renames a project; an empty name keeps the old one', () => {
    expect(renameProject(brandt, '  Familie Brand ').name).toBe('Familie Brand');
    expect(renameProject(brandt, ' ')).toBe(brandt);
  });
});

describe('persons', () => {
  it('adds a person with a new ID and drops empty fields', () => {
    const { project, id } = addPerson(empty, {
      givenNames: 'Anna',
      surname: '',
      birth: { date: { y: 1923 }, place: '' },
      death: { place: '' },
      deceased: false,
      extraFields: [],
    });
    expect(id).toMatch(/^p_/);
    expect(project.persons).toEqual([{ id, givenNames: 'Anna', birth: { date: { y: 1923 } } }]);
    expect(empty.persons).toEqual([]);
  });

  it('adds an empty person (all fields are optional, PERS-02)', () => {
    const { project, id } = addPerson(empty);
    expect(project.persons).toEqual([{ id }]);
  });

  it('updates a person by replacing their data', () => {
    const karl = findPerson(brandt, 'p_karl')!;
    const project = updatePerson(brandt, { ...karl, occupation: 'Werftdirektor', biography: '' });
    const updated = findPerson(project, 'p_karl')!;
    expect(updated.occupation).toBe('Werftdirektor');
    expect(updated).not.toHaveProperty('biography');
    expect(findPerson(brandt, 'p_karl')!.occupation).toBe('Schiffbauingenieur');
  });

  it('refuses to update a person who does not exist', () => {
    expectCode(() => updatePerson(brandt, { id: 'p_nobody' }), 'unknown-person');
  });

  it('deletes a person with their relations, but keeps children and partners', () => {
    const project = deletePerson(brandt, 'p_erna');
    expect(findPerson(project, 'p_erna')).toBeUndefined();
    expect(findPerson(project, 'p_karl')).toBeDefined();
    expect(findPerson(project, 'p_peter')).toBeDefined();
    expect(project.partnerships.some((r) => r.partners.includes('p_erna'))).toBe(false);
    expect(project.parentChild.some((l) => l.parentId === 'p_erna' || l.childId === 'p_erna')).toBe(
      false,
    );
    expect(parentLinksOf(project, 'p_peter').map((l) => l.parentId)).toEqual(['p_karl']);
    validateProject(project);
  });

  it('deleting the last child of an unknown parent also removes the "?" node', () => {
    const once = deletePerson(brandt, 'p_stefan');
    expect(findPerson(once, 'p_unbekannt')).toBeDefined();
    const twice = deletePerson(once, 'p_michael');
    expect(findPerson(twice, 'p_unbekannt')).toBeUndefined();
  });

  it('refuses to delete a person who does not exist', () => {
    expectCode(() => deletePerson(brandt, 'p_nobody'), 'unknown-person');
  });
});

describe('photos (PERS-03)', () => {
  const first = { id: 'img_1', file: 'bilder/img_1.jpg', width: 800, height: 1000 };
  const second = { id: 'img_2', file: 'bilder/img_2.jpg', width: 1000, height: 800 };

  it('sets a photo and replaces an earlier one (one per person)', () => {
    const once = setPhoto(brandt, 'p_erna', first);
    expect(findPerson(once, 'p_erna')?.photoId).toBe('img_1');
    expect(once.images).toEqual([first]);
    const twice = setPhoto(once, 'p_erna', second);
    expect(findPerson(twice, 'p_erna')?.photoId).toBe('img_2');
    expect(twice.images).toEqual([second]);
  });

  it('removes a photo', () => {
    const project = removePhoto(setPhoto(brandt, 'p_erna', first), 'p_erna');
    expect(findPerson(project, 'p_erna')).not.toHaveProperty('photoId');
    expect(project.images).toEqual([]);
  });

  it('deleting a person also drops their photo', () => {
    const project = setPhoto(setPhoto(brandt, 'p_erna', first), 'p_stefan', second);
    expect(deletePerson(project, 'p_erna').images).toEqual([second]);
  });

  it('refuses a person who does not exist', () => {
    expectCode(() => setPhoto(brandt, 'p_nobody', first), 'unknown-person');
  });
});

describe('partnerships', () => {
  it('adds a partnership with details', () => {
    const { project, id } = addPartnership(brandt, 'p_frieda', 'p_stefan', {
      kind: 'marriage',
      start: { date: { y: 1980 }, place: '' },
    });
    expect(id).toMatch(/^u_/);
    expect(project.partnerships.at(-1)).toEqual({
      id,
      partners: ['p_frieda', 'p_stefan'],
      kind: 'marriage',
      start: { date: { y: 1980 } },
    });
  });

  it('allows several partners over a lifetime', () => {
    const { project } = addPartnership(brandt, 'p_karl', 'p_frieda');
    expect(project.partnerships.filter((r) => r.partners.includes('p_karl'))).toHaveLength(3);
  });

  it('applies the partnership rules', () => {
    expectCode(() => addPartnership(brandt, 'p_karl', 'p_karl'), 'self-partnership');
    expectCode(() => addPartnership(brandt, 'p_erna', 'p_karl'), 'duplicate-partnership');
    expectCode(() => addPartnership(brandt, 'p_karl', 'p_nobody'), 'unknown-person');
  });

  it('updates the details and keeps the partners', () => {
    const project = updatePartnership(brandt, 'u_6', {
      kind: 'marriage',
      start: { date: { y: 1979 } },
      end: { date: { y: 1990 }, reason: 'separation' },
    });
    expect(project.partnerships.find((r) => r.id === 'u_6')).toEqual({
      id: 'u_6',
      partners: ['p_ingrid', 'p_michael'],
      kind: 'marriage',
      start: { date: { y: 1979 } },
      end: { date: { y: 1990 }, reason: 'separation' },
    });
  });

  it('clears details that are left empty', () => {
    const project = updatePartnership(brandt, 'u_5', { start: { place: '' }, end: {} });
    expect(project.partnerships.find((r) => r.id === 'u_5')).toEqual({
      id: 'u_5',
      partners: ['p_peter', 'p_sabine'],
    });
  });

  it('removes a partnership; shared children stay children of both', () => {
    const project = removePartnership(brandt, 'u_5');
    expect(project.partnerships.some((r) => r.id === 'u_5')).toBe(false);
    expect(parentLinksOf(project, 'p_lena').map((l) => l.parentId)).toEqual([
      'p_peter',
      'p_sabine',
    ]);
  });

  it('refuses to change a partnership that does not exist', () => {
    expectCode(() => updatePartnership(brandt, 'u_nobody', {}), 'unknown-relation');
    expectCode(() => removePartnership(brandt, 'u_nobody'), 'unknown-relation');
  });
});

describe('parent-child links', () => {
  it('adds a biological link without storing the default kind', () => {
    const { project, id } = addPerson(brandt, { givenNames: 'Paul' });
    const linked = addParentChild(project, 'p_lena', id, 'biological');
    expect(linked.parentChild.at(-1)).toEqual({ parentId: 'p_lena', childId: id });
  });

  it('adds a third parent only as adoptive, step or foster', () => {
    expectCode(() => addParentChild(brandt, 'p_frieda', 'p_peter'), 'too-many-biological-parents');
    const project = addParentChild(brandt, 'p_frieda', 'p_peter', 'foster');
    expect(project.parentChild.at(-1)).toEqual({
      parentId: 'p_frieda',
      childId: 'p_peter',
      kind: 'foster',
    });
  });

  it('applies the link rules', () => {
    expectCode(() => addParentChild(brandt, 'p_karl', 'p_peter', 'step'), 'duplicate-link');
    expectCode(() => addParentChild(brandt, 'p_mia', 'p_heinrich'), 'loop');
    expectCode(() => addParentChild(brandt, 'p_mia', 'p_mia'), 'loop');
    expectCode(() => addParentChild(brandt, 'p_nobody', 'p_mia'), 'unknown-person');
  });

  it('changes the kind of a link', () => {
    const adoptive = setParentChildKind(brandt, 'p_karl', 'p_peter', 'adoptive');
    expect(parentLinksOf(adoptive, 'p_peter')[0]).toEqual({
      parentId: 'p_karl',
      childId: 'p_peter',
      kind: 'adoptive',
    });
    const back = setParentChildKind(adoptive, 'p_karl', 'p_peter', 'biological');
    expect(parentLinksOf(back, 'p_peter')[0]).toEqual({ parentId: 'p_karl', childId: 'p_peter' });
  });

  it('allows a link to become biological only if a slot is free', () => {
    const withFoster = addParentChild(brandt, 'p_frieda', 'p_peter', 'foster');
    expectCode(
      () => setParentChildKind(withFoster, 'p_frieda', 'p_peter', 'biological'),
      'too-many-biological-parents',
    );
    // Jonas has two adoptive parents, so either may become biological.
    const project = setParentChildKind(brandt, 'p_ingrid', 'p_jonas', 'biological');
    expect(parentLinksOf(project, 'p_jonas')[0]).toEqual({
      parentId: 'p_ingrid',
      childId: 'p_jonas',
    });
  });

  it('removes a link and keeps both persons', () => {
    const project = removeParentChild(brandt, 'p_karl', 'p_thomas');
    expect(parentLinksOf(project, 'p_thomas').map((l) => l.parentId)).toEqual(['p_hildegard']);
    expect(findPerson(project, 'p_karl')).toBeDefined();
  });

  it('removes an unknown parent together with its last link', () => {
    const once = removeParentChild(brandt, 'p_unbekannt', 'p_stefan');
    expect(findPerson(once, 'p_unbekannt')).toBeDefined();
    const twice = removeParentChild(once, 'p_unbekannt', 'p_michael');
    expect(findPerson(twice, 'p_unbekannt')).toBeUndefined();
  });

  it('refuses to change a link that does not exist', () => {
    expectCode(() => setParentChildKind(brandt, 'p_mia', 'p_karl', 'step'), 'unknown-relation');
    expectCode(() => removeParentChild(brandt, 'p_mia', 'p_karl'), 'unknown-relation');
  });
});

describe('unknown parents (placeholders)', () => {
  it('creates an unknown parent for a person without parents', () => {
    const { project, id } = addUnknownParent(brandt, 'p_sabine');
    expect(isPlaceholder(findPerson(project, id)!)).toBe(true);
    expect(parentLinksOf(project, 'p_sabine')).toEqual([{ parentId: id, childId: 'p_sabine' }]);
  });

  it('refuses when two biological parents are already known', () => {
    expectCode(() => addUnknownParent(brandt, 'p_peter'), 'too-many-biological-parents');
  });

  it('becomes a normal person once any field is filled in', () => {
    const project = updatePerson(brandt, { id: 'p_unbekannt', givenNames: 'Hanna' });
    expect(isPlaceholder(findPerson(project, 'p_unbekannt')!)).toBe(false);
    const freed = removeParentChild(
      removeParentChild(project, 'p_unbekannt', 'p_stefan'),
      'p_unbekannt',
      'p_michael',
    );
    expect(findPerson(freed, 'p_unbekannt')).toBeDefined();
  });

  it('only drops the persons it is asked about, so a new empty person survives', () => {
    const { project, id } = addPerson(brandt);
    expect(findPerson(dropEmptyPlaceholders(project, ['p_karl']), id)).toBeDefined();
    expect(findPerson(dropEmptyPlaceholders(project, [id]), id)).toBeUndefined();
  });
});

describe('purity', () => {
  it('never changes the input project (it is frozen here)', () => {
    const steps: ((p: Project) => Project)[] = [
      (p) => addPerson(p, { givenNames: 'Paul' }).project,
      (p) => updatePerson(p, { id: 'p_kim', givenNames: 'Kim Luca' }),
      (p) => deletePerson(p, 'p_unbekannt'),
      (p) => addPartnership(p, 'p_frieda', 'p_stefan').project,
      (p) => updatePartnership(p, 'u_7', { kind: 'partnership' }),
      (p) => removePartnership(p, 'u_7'),
      (p) => addParentChild(p, 'p_frieda', 'p_jonas', 'foster'),
      (p) => setParentChildKind(p, 'p_karl', 'p_ingrid', 'step'),
      (p) => removeParentChild(p, 'p_karl', 'p_ingrid'),
      (p) => addUnknownParent(p, 'p_sabine').project,
    ];
    for (const step of steps) {
      const result = step(brandt);
      expect(result).not.toBe(brandt);
      validateProject(result);
    }
    expect(brandt).toEqual(familieBrandt);
  });
});
