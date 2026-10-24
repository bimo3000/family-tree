import { describe, expect, it } from 'vitest';
import { assignRows } from '../../../src/core/layout/generations';
import { buildGraph } from '../../../src/core/layout/graph';
import { orderRows } from '../../../src/core/layout/order';
import type { Project } from '../../../src/core/model/types';
import {
  brandt,
  cousinMarriage,
  family,
  simple,
  singleParents,
  threePartners,
} from '../../fixtures/layout-families';

/** Blocks per row, each block written as its IDs joined by "+". */
function order(project: Project): string[][] {
  const graph = buildGraph(project);
  return orderRows(graph, assignRows(graph)).map((row) => row.map((block) => block.join('+')));
}

describe('row order', () => {
  it('keeps a couple in data order and their children in birth order', () => {
    expect(order(simple)).toEqual([['anna+bernd'], ['clara', 'david', 'emil']]);
  });

  it('sorts siblings by birth, not by data order', () => {
    const project = family('late-entry', (f) => {
      f.persons('mum:1950 dad:1950 young:1990 old:1980 middle:1985');
      f.couple('mum', 'dad');
      f.children(['mum', 'dad'], 'young old middle');
    });
    expect(order(project)[1]).toEqual(['old', 'middle', 'young']);
  });

  it('orders Familie Brandt like the mock-up', () => {
    expect(order(brandt)).toEqual([
      ['p_heinrich+p_margarete', 'p_wilhelm+p_elise'],
      ['p_frieda', 'p_hildegard+p_karl+p_erna', 'p_unbekannt'],
      ['p_julia+p_thomas', 'p_peter+p_sabine', 'p_ingrid+p_michael', 'p_stefan'],
      ['p_mia', 'p_kim', 'p_lena', 'p_felix', 'p_jonas'],
    ]);
  });

  it('puts a person between the first and later partners, children under each couple', () => {
    expect(order(threePartners)).toEqual([
      ['bea+alex+cora+dora'],
      ['kid1', 'kid2', 'kid3', 'kid4'],
    ]);
  });

  it('places an unknown parent next to the known one', () => {
    expect(order(singleParents)[0]).toEqual(['mother', 'unknown', 'father']);
  });

  it('keeps married cousins together between their parents', () => {
    expect(order(cousinMarriage)).toEqual([
      ['gpa+gma'],
      ['aunt+inlawA', 'uncle+inlawB'],
      ['c1+c2'],
      ['kid'],
    ]);
  });

  it('is deterministic', () => {
    expect(order(brandt)).toEqual(order(brandt));
  });
});
