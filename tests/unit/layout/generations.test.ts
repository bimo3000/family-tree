import { describe, expect, it } from 'vitest';
import { assignRows } from '../../../src/core/layout/generations';
import { buildGraph } from '../../../src/core/layout/graph';
import type { Project } from '../../../src/core/model/types';
import {
  brandt,
  cousinMarriage,
  marriedIn,
  partnerIsAncestor,
  simple,
  uncleNiece,
} from '../../fixtures/layout-families';

/** IDs per row, in data order. */
function rows(project: Project): string[][] {
  const result: string[][] = [];
  for (const [id, row] of assignRows(buildGraph(project))) (result[row] ??= []).push(id);
  return result;
}

describe('generation rows', () => {
  it('puts a couple above their children', () => {
    expect(rows(simple)).toEqual([
      ['anna', 'bernd'],
      ['clara', 'david', 'emil'],
    ]);
  });

  it('gives Familie Brandt the rows of the mock-up', () => {
    expect(rows(brandt)).toEqual([
      ['p_heinrich', 'p_margarete', 'p_wilhelm', 'p_elise'],
      ['p_frieda', 'p_hildegard', 'p_karl', 'p_erna', 'p_unbekannt'],
      ['p_julia', 'p_thomas', 'p_peter', 'p_sabine', 'p_ingrid', 'p_michael', 'p_stefan'],
      ['p_mia', 'p_kim', 'p_lena', 'p_felix', 'p_jonas'],
    ]);
  });

  it('pulls married-in ancestors down to just above their child', () => {
    expect(rows(marriedIn)).toEqual([
      ['a1', 'a2'],
      ['b1', 'b2', 'xg'],
      ['c1', 'c2', 'xp1', 'xp2'],
      ['d1', 'x'],
    ]);
  });

  it('keeps married cousins in one row', () => {
    const r = rows(cousinMarriage);
    expect(r[2]).toEqual(['c1', 'c2']);
    expect(r[3]).toEqual(['kid']);
  });

  it('moves an uncle down to his niece, with a long line to his parents', () => {
    expect(rows(uncleNiece)).toEqual([
      ['gpa', 'gma'],
      ['sister', 'inlaw'],
      ['uncle', 'niece'],
      ['kid'],
    ]);
  });

  it('keeps a partner who is also an ancestor in their own row', () => {
    expect(rows(partnerIsAncestor)).toEqual([['parent'], ['child'], ['grandchild']]);
  });
});
