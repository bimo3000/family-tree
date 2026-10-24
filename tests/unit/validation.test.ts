import { describe, expect, it } from 'vitest';
import { validateProject, type ModelErrorCode } from '../../src/core/model/validation';
import type { Project } from '../../src/core/model/types';
import { familieBrandt as brandt } from '../fixtures/familie-brandt';
import { expectCode } from './helpers';

const pair = (a: string, b: string): [string, string] => [a, b];

describe('validateProject', () => {
  it('accepts the example family', () => {
    expect(() => validateProject(brandt)).not.toThrow();
  });

  it('accepts two biological parents plus further adoptive, step and foster parents', () => {
    const project: Project = {
      ...brandt,
      parentChild: [
        ...brandt.parentChild,
        { parentId: 'p_frieda', childId: 'p_peter', kind: 'foster' },
        { parentId: 'p_hildegard', childId: 'p_peter', kind: 'step' },
      ],
    };
    expect(() => validateProject(project)).not.toThrow();
  });

  it('accepts cousin marriages (a loop through partners is fine)', () => {
    // Lena and Jonas are cousins (Peter and Ingrid are siblings).
    const project: Project = {
      ...brandt,
      partnerships: [...brandt.partnerships, { id: 'u_x', partners: pair('p_lena', 'p_jonas') }],
    };
    expect(() => validateProject(project)).not.toThrow();
  });

  it.each<[string, Partial<Project>, ModelErrorCode]>([
    ['a duplicate person ID', { persons: [...brandt.persons, { id: 'p_karl' }] }, 'duplicate-id'],
    [
      'a duplicate partnership ID',
      {
        partnerships: [...brandt.partnerships, { id: 'u_1', partners: pair('p_lena', 'p_jonas') }],
      },
      'duplicate-id',
    ],
    [
      'a partnership with an unknown person',
      { partnerships: [{ id: 'u_x', partners: pair('p_karl', 'p_nobody') }] },
      'unknown-person',
    ],
    [
      'a partnership with oneself',
      { partnerships: [{ id: 'u_x', partners: pair('p_karl', 'p_karl') }] },
      'self-partnership',
    ],
    [
      'the same couple twice (in either order)',
      {
        partnerships: [
          { id: 'u_x', partners: pair('p_karl', 'p_erna') },
          { id: 'u_y', partners: pair('p_erna', 'p_karl') },
        ],
      },
      'duplicate-partnership',
    ],
    [
      'a link to an unknown person',
      { parentChild: [{ parentId: 'p_nobody', childId: 'p_karl' }] },
      'unknown-person',
    ],
    [
      'the same parent-child link twice, even with another kind',
      {
        parentChild: [
          { parentId: 'p_karl', childId: 'p_peter' },
          { parentId: 'p_karl', childId: 'p_peter', kind: 'adoptive' },
        ],
      },
      'duplicate-link',
    ],
    ['being ones own parent', { parentChild: [{ parentId: 'p_karl', childId: 'p_karl' }] }, 'loop'],
    [
      'being ones own ancestor',
      { parentChild: [...brandt.parentChild, { parentId: 'p_mia', childId: 'p_heinrich' }] },
      'loop',
    ],
    [
      'a third biological parent',
      { parentChild: [...brandt.parentChild, { parentId: 'p_frieda', childId: 'p_peter' }] },
      'too-many-biological-parents',
    ],
    [
      'a third parent marked biological explicitly',
      {
        parentChild: [
          ...brandt.parentChild,
          { parentId: 'p_frieda', childId: 'p_peter', kind: 'biological' },
        ],
      },
      'too-many-biological-parents',
    ],
  ])('rejects %s', (_, change, code) => {
    expectCode(() => validateProject({ ...brandt, ...change }), code);
  });
});
