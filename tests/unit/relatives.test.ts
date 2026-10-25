import { describe, expect, it } from 'vitest';
import { addPerson } from '../../src/core/model/operations';
import {
  findPerson,
  isPlaceholder,
  parentLinksOf,
  partnershipsOf,
} from '../../src/core/model/queries';
import {
  addChild,
  addParent,
  addPartner,
  addSibling,
  childKindNeeded,
  cutOffBy,
  ends,
  removeRelation,
} from '../../src/core/model/relatives';
import { validateProject } from '../../src/core/model/validation';
import type { ParentChildLink, Partnership, Project } from '../../src/core/model/types';
import { familieBrandt } from '../fixtures/familie-brandt';
import { expectCode } from './helpers';

const brandt = Object.freeze(structuredClone(familieBrandt));
const parents = (project: Project, id: string) =>
  parentLinksOf(project, id).map((l) => [l.parentId, l.kind ?? 'biological']);
const partnership = (id: string): Partnership => brandt.partnerships.find((r) => r.id === id)!;
const link = (parentId: string, childId: string): ParentChildLink =>
  brandt.parentChild.find((l) => l.parentId === parentId && l.childId === childId)!;

describe('addChild', () => {
  it('adds a new, empty child of the person and their partner', () => {
    const { project, id } = addChild(brandt, ['p_thomas', 'p_julia']);
    expect(findPerson(project, id)).toEqual({ id });
    expect(parents(project, id)).toEqual([
      ['p_thomas', 'biological'],
      ['p_julia', 'biological'],
    ]);
    validateProject(project);
  });

  it('adds a child of one parent only ("anderer/unbekannter Elternteil")', () => {
    const { project, id } = addChild(brandt, ['p_karl']);
    expect(parents(project, id)).toEqual([['p_karl', 'biological']]);
  });

  it('links an existing person as a child, with a kind', () => {
    const { project, id } = addChild(brandt, ['p_frieda'], {
      existingId: 'p_lena',
      kind: 'foster',
    });
    expect(id).toBe('p_lena');
    expect(project.persons).toHaveLength(brandt.persons.length);
    expect(parents(project, 'p_lena')).toContainEqual(['p_frieda', 'foster']);
  });

  it('skips a parent the existing child already has', () => {
    // Thomas is Karl's son; linking him to Karl and Erna only adds Erna (as stepmother).
    const { project } = addChild(brandt, ['p_karl', 'p_erna'], {
      existingId: 'p_thomas',
      kind: 'step',
    });
    expect(parents(project, 'p_thomas')).toEqual([
      ['p_karl', 'biological'],
      ['p_hildegard', 'biological'],
      ['p_erna', 'step'],
    ]);
  });

  it('rejects a child that is linked to all parents already', () => {
    expectCode(
      () => addChild(brandt, ['p_karl', 'p_erna'], { existingId: 'p_peter' }),
      'duplicate-link',
    );
  });

  it('rejects a loop: an ancestor cannot become a child', () => {
    expectCode(
      () => addChild(brandt, ['p_peter'], { existingId: 'p_karl', kind: 'adoptive' }),
      'loop',
    );
  });

  it('rejects a third biological parent', () => {
    expectCode(
      () => addChild(brandt, ['p_frieda'], { existingId: 'p_lena' }),
      'too-many-biological-parents',
    );
  });

  it('rejects unknown parents', () => {
    expectCode(() => addChild(brandt, ['p_nobody']), 'unknown-person');
  });
});

describe('addPartner', () => {
  it('adds a new partner', () => {
    const { project, id } = addPartner(brandt, 'p_frieda');
    expect(partnershipsOf(project, 'p_frieda').map((r) => r.partners)).toEqual([['p_frieda', id]]);
  });

  it('links an existing person as a partner', () => {
    const { project } = addPartner(brandt, 'p_frieda', { existingId: 'p_stefan' });
    expect(partnershipsOf(project, 'p_stefan')).toHaveLength(1);
  });

  it('rejects a second partnership of the same couple', () => {
    expectCode(
      () => addPartner(brandt, 'p_karl', { existingId: 'p_erna' }),
      'duplicate-partnership',
    );
  });
});

describe('addParent', () => {
  it('adds a parent who becomes the partner of the one known parent', () => {
    const { project, id } = addParent(brandt, 'p_michael', { partnerOf: 'p_unbekannt' });
    expect(parents(project, 'p_michael')).toContainEqual([id, 'biological']);
    expect(partnershipsOf(project, id).map((r) => r.partners)).toEqual([['p_unbekannt', id]]);
  });

  it('adds a parent without a partnership when the box is not ticked', () => {
    const { project, id } = addParent(brandt, 'p_michael');
    expect(partnershipsOf(project, id)).toEqual([]);
  });

  it('does not add a partnership that exists already', () => {
    const base = addPartner(brandt, 'p_frieda', { existingId: 'p_stefan' }).project;
    const { project } = addParent(base, 'p_jonas', {
      existingId: 'p_stefan',
      kind: 'foster',
      partnerOf: 'p_frieda',
    });
    expect(partnershipsOf(project, 'p_stefan')).toHaveLength(1);
  });

  it('needs a kind when two biological parents exist', () => {
    expectCode(() => addParent(brandt, 'p_karl'), 'too-many-biological-parents');
    const { project, id } = addParent(brandt, 'p_karl', { kind: 'adoptive' });
    expect(parents(project, 'p_karl')).toContainEqual([id, 'adoptive']);
  });
});

describe('addSibling', () => {
  it('adds a child of the same parents', () => {
    const { project, id } = addSibling(brandt, 'p_peter');
    expect(parents(project, id)).toEqual(parents(brandt, 'p_peter'));
  });

  it('copies the kind of each parent link', () => {
    const { project, id } = addSibling(brandt, 'p_jonas');
    expect(parents(project, id)).toEqual([
      ['p_ingrid', 'adoptive'],
      ['p_michael', 'adoptive'],
    ]);
  });

  it('uses the given kind for an existing person with biological parents', () => {
    const { project } = addSibling(brandt, 'p_mia', { existingId: 'p_jonas', kind: 'foster' });
    expect(parents(project, 'p_jonas')).toContainEqual(['p_thomas', 'foster']);
  });

  it('applies the given kind only to links that would be biological', () => {
    // Peter: Karl and Erna, plus Frieda as adoptive mother. The other links stay as they are.
    const adopted = {
      ...brandt,
      parentChild: [
        ...brandt.parentChild,
        { parentId: 'p_frieda', childId: 'p_peter', kind: 'adoptive' as const },
      ],
    };
    const { project } = addSibling(adopted, 'p_peter', { existingId: 'p_julia', kind: 'foster' });
    expect(parents(project, 'p_julia')).toEqual([
      ['p_karl', 'foster'],
      ['p_erna', 'foster'],
      ['p_frieda', 'adoptive'],
    ]);
    validateProject(project);
  });

  it('creates an unknown parent when the person has no parents', () => {
    const { project, id } = addSibling(brandt, 'p_julia');
    const [placeholder] = parentLinksOf(project, 'p_julia');
    expect(isPlaceholder(findPerson(project, placeholder!.parentId)!)).toBe(true);
    expect(parents(project, id)).toEqual([[placeholder!.parentId, 'biological']]);
    validateProject(project);
  });
});

describe('childKindNeeded', () => {
  it('is false while the child has at most two biological parents', () => {
    const lone = addPerson(brandt).project;
    expect(childKindNeeded(lone, lone.persons.at(-1)!.id, ['p_karl', 'p_erna'])).toBe(false);
    expect(childKindNeeded(brandt, 'p_thomas', ['p_karl'])).toBe(false);
    expect(childKindNeeded(brandt, 'p_jonas', ['p_thomas', 'p_julia'])).toBe(false);
  });

  it('is true when a third biological parent would come', () => {
    expect(childKindNeeded(brandt, 'p_thomas', ['p_karl', 'p_erna'])).toBe(true);
    expect(childKindNeeded(brandt, 'p_lena', ['p_frieda'])).toBe(true);
  });
});

describe('cutOffBy and removeRelation', () => {
  it('cuts nobody off when the persons stay connected another way', () => {
    // Peter and Sabine share their children Lena and Felix.
    expect(cutOffBy(brandt, partnership('u_5'))).toEqual([]);
  });

  it('names the one person left on their own', () => {
    const otto = addPerson(brandt, { givenNames: 'Otto' });
    const { project, id } = addPartner(otto.project, 'p_frieda', { existingId: otto.id });
    const r = partnershipsOf(project, id)[0]!;
    expect(cutOffBy(project, r)).toEqual([id]);
    // A still empty partner is not named: removing the partnership drops it anyway.
    const blank = addPartner(brandt, 'p_frieda');
    expect(cutOffBy(blank.project, partnershipsOf(blank.project, blank.id)[0]!)).toEqual([]);
  });

  it('names a whole cut-off branch, without unknown parents', () => {
    // Erna → Ingrid still connects Ingrid's family. Without it, removing Karl → Ingrid cuts off
    // Ingrid, Michael, Stefan, Jonas and the "?" (which is not named).
    expect(cutOffBy(brandt, link('p_karl', 'p_ingrid'))).toEqual([]);
    const without = removeRelation(brandt, link('p_erna', 'p_ingrid'));
    expect(cutOffBy(without, link('p_karl', 'p_ingrid')).sort()).toEqual(
      ['p_ingrid', 'p_jonas', 'p_michael', 'p_stefan'].sort(),
    );
  });

  it('removes partnerships and links, keeping the persons', () => {
    const a = removeRelation(brandt, partnership('u_7'));
    expect(a.partnerships).toHaveLength(brandt.partnerships.length - 1);
    expect(a.persons).toHaveLength(brandt.persons.length);
    const b = removeRelation(brandt, link('p_thomas', 'p_mia'));
    expect(parents(b, 'p_mia')).toEqual([['p_julia', 'biological']]);
  });

  it('drops an unknown parent left without children', () => {
    const a = removeRelation(brandt, link('p_unbekannt', 'p_michael'));
    const b = removeRelation(a, link('p_unbekannt', 'p_stefan'));
    expect(findPerson(b, 'p_unbekannt')).toBeUndefined();
  });

  it('names the two ends of a relation', () => {
    expect(ends(partnership('u_1'))).toEqual(['p_heinrich', 'p_margarete']);
    expect(ends(link('p_karl', 'p_peter'))).toEqual(['p_karl', 'p_peter']);
  });
});
