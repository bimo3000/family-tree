import { describe, expect, it } from 'vitest';
import {
  ancestorsOf,
  childLinksOf,
  connectedComponent,
  descendantsOf,
  findPerson,
  focusSet,
  isBiological,
  isPlaceholder,
  parentLinksOf,
  partnerOf,
  partnershipsOf,
  sameRelation,
  siblingsOf,
} from '../../src/core/model/queries';
import { familieBrandt as brandt } from '../fixtures/familie-brandt';

const sorted = (ids: Iterable<string>) => [...ids].sort();

describe('parents and children', () => {
  it('finds parent and child links', () => {
    expect(parentLinksOf(brandt, 'p_karl').map((l) => l.parentId)).toEqual([
      'p_heinrich',
      'p_margarete',
    ]);
    expect(sorted(childLinksOf(brandt, 'p_karl').map((l) => l.childId))).toEqual([
      'p_ingrid',
      'p_peter',
      'p_thomas',
    ]);
    expect(parentLinksOf(brandt, 'p_heinrich')).toEqual([]);
  });

  it('treats a link without kind as biological', () => {
    expect(isBiological({ parentId: 'a', childId: 'b' })).toBe(true);
    expect(isBiological({ parentId: 'a', childId: 'b', kind: 'biological' })).toBe(true);
    expect(isBiological({ parentId: 'a', childId: 'b', kind: 'adoptive' })).toBe(false);
  });
});

describe('partners', () => {
  it('orders several partnerships by start date, regardless of creation order', () => {
    const reversed = { ...brandt, partnerships: [...brandt.partnerships].reverse() };
    expect(partnershipsOf(reversed, 'p_karl').map((r) => partnerOf(r, 'p_karl'))).toEqual([
      'p_erna',
      'p_hildegard',
    ]);
  });

  it('puts undated partnerships last, in creation order', () => {
    const project = {
      ...brandt,
      partnerships: [
        { id: 'u_a', partners: ['p_x', 'p_a'] as [string, string] },
        { id: 'u_b', partners: ['p_x', 'p_b'] as [string, string], start: { date: { y: 1990 } } },
        { id: 'u_c', partners: ['p_c', 'p_x'] as [string, string] },
      ],
    };
    expect(partnershipsOf(project, 'p_x').map((r) => r.id)).toEqual(['u_b', 'u_a', 'u_c']);
  });

  it('returns the other partner from either side', () => {
    const [u5] = partnershipsOf(brandt, 'p_sabine');
    expect(partnerOf(u5!, 'p_sabine')).toBe('p_peter');
    expect(partnerOf(u5!, 'p_peter')).toBe('p_sabine');
  });
});

describe('siblingsOf', () => {
  it('tells full from half siblings, ordered by birth', () => {
    expect(siblingsOf(brandt, 'p_peter')).toEqual([
      { id: 'p_ingrid', full: true },
      { id: 'p_thomas', full: false },
    ]);
    expect(siblingsOf(brandt, 'p_thomas')).toEqual([
      { id: 'p_peter', full: false },
      { id: 'p_ingrid', full: false },
    ]);
  });

  it('counts a shared unknown parent', () => {
    expect(siblingsOf(brandt, 'p_michael')).toEqual([{ id: 'p_stefan', full: true }]);
  });

  it('is empty for an only child and for a person without parents', () => {
    expect(siblingsOf(brandt, 'p_jonas')).toEqual([]);
    expect(siblingsOf(brandt, 'p_heinrich')).toEqual([]);
  });
});

describe('ancestors, descendants and focus', () => {
  it('walks all generations up', () => {
    expect(sorted(ancestorsOf(brandt, 'p_mia'))).toEqual(
      sorted(['p_thomas', 'p_julia', 'p_karl', 'p_hildegard', 'p_heinrich', 'p_margarete']),
    );
  });

  it('walks all generations down, including adopted children', () => {
    expect(sorted(descendantsOf(brandt, 'p_karl'))).toEqual(
      sorted(['p_peter', 'p_ingrid', 'p_thomas', 'p_mia', 'p_kim', 'p_lena', 'p_felix', 'p_jonas']),
    );
  });

  it('focuses the line: self, ancestors, descendants and partners', () => {
    expect(sorted(focusSet(brandt, 'p_peter'))).toEqual(
      sorted([
        'p_peter',
        'p_karl',
        'p_erna',
        'p_heinrich',
        'p_margarete',
        'p_wilhelm',
        'p_elise',
        'p_lena',
        'p_felix',
        'p_sabine',
      ]),
    );
  });

  it('terminates on a loop in broken data', () => {
    const loop = {
      ...brandt,
      parentChild: [
        { parentId: 'a', childId: 'b' },
        { parentId: 'b', childId: 'a' },
      ],
    };
    expect(sorted(ancestorsOf(loop, 'a'))).toEqual(['b']);
  });
});

describe('connectedComponent', () => {
  it('reaches the whole example family', () => {
    expect(connectedComponent(brandt, 'p_heinrich').size).toBe(brandt.persons.length);
  });

  it('shows who would be cut off without a relation', () => {
    const link = { parentId: 'p_unbekannt', childId: 'p_stefan' };
    expect(sorted(connectedComponent(brandt, 'p_stefan', link))).toEqual(['p_stefan']);
  });

  it('keeps a divorced partner connected through the shared children', () => {
    const [u5] = partnershipsOf(brandt, 'p_sabine');
    expect(connectedComponent(brandt, 'p_sabine', u5).has('p_peter')).toBe(true);
  });

  it('contains only the start for an unconnected person', () => {
    expect(sorted(connectedComponent(brandt, 'p_nobody'))).toEqual(['p_nobody']);
  });
});

describe('helpers', () => {
  it('finds persons by ID', () => {
    expect(findPerson(brandt, 'p_kim')?.givenNames).toBe('Kim');
    expect(findPerson(brandt, 'p_nobody')).toBeUndefined();
  });

  it('recognizes an unknown-parent placeholder', () => {
    expect(isPlaceholder(findPerson(brandt, 'p_unbekannt')!)).toBe(true);
    expect(isPlaceholder({ id: 'p_x', givenNames: 'Anna' })).toBe(false);
  });

  it('compares relations by identity, not by object', () => {
    const u = { id: 'u_1', partners: ['a', 'b'] as [string, string] };
    expect(sameRelation(u, { ...u })).toBe(true);
    expect(sameRelation(u, { ...u, id: 'u_2' })).toBe(false);
    expect(sameRelation({ parentId: 'a', childId: 'b' }, { parentId: 'a', childId: 'b' })).toBe(
      true,
    );
    expect(sameRelation({ parentId: 'a', childId: 'b' }, u)).toBe(false);
    expect(sameRelation(u, undefined)).toBe(false);
  });
});
