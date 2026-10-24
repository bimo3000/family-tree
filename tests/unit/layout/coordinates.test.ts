import { describe, expect, it } from 'vitest';
import { closestInOrder, placeRows } from '../../../src/core/layout/coordinates';
import { assignRows } from '../../../src/core/layout/generations';
import { buildGraph } from '../../../src/core/layout/graph';
import { orderRows } from '../../../src/core/layout/order';
import type { Project } from '../../../src/core/model/types';
import { family, simple, threePartners } from '../../fixtures/layout-families';

/** Cards 100 wide with 20 between them. */
function place(project: Project): Map<string, number> {
  const graph = buildGraph(project);
  return placeRows(
    graph,
    orderRows(graph, assignRows(graph)),
    () => 100,
    () => 20,
  );
}

describe('closest positions in order', () => {
  it('keeps wishes that already have room', () => {
    expect(closestInOrder([0, 200, 500], [1, 1, 1], [100, 100])).toEqual([0, 200, 500]);
  });

  it('spreads clashing wishes evenly around their average', () => {
    expect(closestInOrder([100, 100, 100], [1, 1, 1], [50, 50])).toEqual([50, 100, 150]);
  });

  it('lets the heavier wish win', () => {
    expect(closestInOrder([0, 0], [3, 1], [100])).toEqual([-25, 75]);
  });

  it('never reorders', () => {
    expect(closestInOrder([300, 0], [1, 1], [100])).toEqual([100, 200]);
  });
});

describe('x positions', () => {
  it('centres a couple above their children', () => {
    const x = place(simple);
    expect(x.get('bernd')! - x.get('anna')!).toBe(120);
    expect(x.get('david')! - x.get('clara')!).toBeCloseTo(120);
    expect(x.get('emil')! - x.get('david')!).toBeCloseTo(120);
    expect((x.get('anna')! + x.get('bernd')!) / 2).toBeCloseTo(x.get('david')!);
  });

  it('centres an only child below its parents', () => {
    const x = place(
      family('only-child', (f) => {
        f.persons('mum dad kid');
        f.couple('mum', 'dad');
        f.children(['mum', 'dad'], 'kid');
      }),
    );
    expect(x.get('kid')!).toBeCloseTo((x.get('mum')! + x.get('dad')!) / 2);
  });

  it('puts each couple of a person with several partners above their own children', () => {
    const x = place(threePartners);
    const middle = (a: string, b: string) => (x.get(a)! + x.get(b)!) / 2;
    // kid2 hangs from Alex and Cora, kid3 and kid4 from Alex and Dora: each group sits below its own couple.
    expect(Math.abs(x.get('kid2')! - middle('alex', 'cora'))).toBeLessThan(
      Math.abs(x.get('kid2')! - middle('alex', 'dora')),
    );
    expect(x.get('kid1')!).toBeLessThan(x.get('kid2')!);
    expect(x.get('kid2')!).toBeLessThan(x.get('kid3')!);
  });
});
