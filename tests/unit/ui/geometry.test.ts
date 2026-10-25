import { describe, expect, it } from 'vitest';
import { computeLayout } from '../../../src/core/layout';
import { focusSet } from '../../../src/core/model/queries';
import {
  centerOn,
  endMarkD,
  fitView,
  halfCouple,
  highlight,
  isOnScreen,
  MAX_ZOOM,
  MIN_ZOOM,
  pathD,
  PRINT_AREA,
  printView,
  zoomAt,
} from '../../../src/ui/tree/geometry';
import { familieBrandt } from '../../fixtures/familie-brandt';
import { family } from '../../fixtures/layout-families';

const viewport = { width: 1000, height: 800 };

describe('svg paths', () => {
  it('joins points into a path', () => {
    expect(
      pathD([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 5 },
      ]),
    ).toBe('M0 0 L10 0 L10 5');
  });

  it('leaves a small gap where another line crosses a horizontal piece', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0, y: 20 },
      { x: 100, y: 20 },
    ];
    expect(pathD(points, [{ x: 40, y: 20 }])).toBe('M0 0 L0 20 L35 20 M45 20 L100 20');
    // Right to left, two breaks in the order of drawing; a break on another path's piece is ignored.
    expect(
      pathD([...points].reverse(), [
        { x: 30, y: 20 },
        { x: 60, y: 20 },
        { x: 0, y: 10 },
        { x: 200, y: 20 },
      ]),
    ).toBe('M100 20 L65 20 M55 20 L35 20 M25 20 L0 20 L0 0');
  });

  it('keeps a gap near a corner inside its piece', () => {
    expect(
      pathD(
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
        ],
        [{ x: 2, y: 0 }],
      ),
    ).toBe('M0 0 L0 0 M7 0 L10 0');
  });

  it('draws the "//" around the given point', () => {
    expect(endMarkD({ x: 100, y: 50 })).toBe('M93 57 L99 43 M101 57 L107 43');
  });
});

describe('print view (UI-03)', () => {
  const fits = (drawing: { width: number; height: number }) => {
    const v = printView(drawing);
    expect(v.x).toBeGreaterThanOrEqual(0);
    expect(v.y).toBe(0);
    expect(v.x + drawing.width * v.k).toBeLessThanOrEqual(PRINT_AREA.width + 1e-9);
    expect(drawing.height * v.k).toBeLessThanOrEqual(PRINT_AREA.height + 1e-9);
    return v;
  };

  it('shrinks a wide tree to the page width, centred', () => {
    const v = fits({ width: 5000, height: 1000 });
    expect(v.k).toBeCloseTo(PRINT_AREA.width / 5000);
    expect(v.x).toBeCloseTo(0);
  });

  it('shrinks a tall tree to the page height, centred across', () => {
    const v = fits({ width: 1000, height: 3000 });
    expect(v.k).toBeCloseTo(PRINT_AREA.height / 3000);
    expect(v.x + 500 * v.k).toBeCloseTo(PRINT_AREA.width / 2);
  });

  it('never enlarges a small tree, and copes with an empty one', () => {
    expect(fits({ width: 150, height: 180 }).k).toBe(1);
    expect(fits({ width: 0, height: 0 }).k).toBe(1);
  });

  it('fits the example family', () => {
    fits(computeLayout(familieBrandt));
  });
});

describe('view (TREE-02)', () => {
  it('fits a big drawing into the viewport, centred', () => {
    const view = fitView({ width: 3000, height: 1000 }, viewport);
    expect(view.k).toBeCloseTo((1000 - 80) / 3000);
    expect(view.x + 1500 * view.k).toBeCloseTo(500);
    expect(view.y + 500 * view.k).toBeCloseTo(400);
  });

  it('does not blow up a small drawing, and never zooms out beyond the limit', () => {
    expect(fitView({ width: 100, height: 100 }, viewport).k).toBe(1.1);
    expect(fitView({ width: 100000, height: 100 }, viewport).k).toBe(MIN_ZOOM);
    expect(fitView({ width: 0, height: 0 }, viewport).k).toBe(1.1);
  });

  it('zooms around the pointer and respects the limits', () => {
    const view = zoomAt({ x: 0, y: 0, k: 1 }, 2, 100, 50);
    expect(view).toEqual({ x: -100, y: -50, k: 2 });
    // The drawing point under the pointer stays under the pointer.
    expect((100 - view.x) / view.k).toBe(100);
    expect(zoomAt({ x: 0, y: 0, k: 2 }, 10, 0, 0).k).toBe(MAX_ZOOM);
    expect(zoomAt({ x: 0, y: 0, k: 0.3 }, 0.1, 0, 0).k).toBe(MIN_ZOOM);
  });

  it('centres a point and tells whether it is on screen', () => {
    const view = centerOn({ x: 0, y: 0, k: 0.5 }, { x: 400, y: 200 }, viewport);
    expect(view).toEqual({ x: 300, y: 300, k: 0.5 });
    expect(isOnScreen(view, { x: 400, y: 200 }, viewport)).toBe(true);
    expect(isOnScreen(view, { x: -500, y: 200 }, viewport)).toBe(false);
    expect(isOnScreen(view, { x: 1350, y: 200 }, viewport)).toBe(false);
  });
});

describe('highlighted line of the selected person', () => {
  const layout = computeLayout(familieBrandt);
  const lineOf = (parentIds: string[]) =>
    layout.childLines.findIndex(
      (l) =>
        l.parentIds.length === parentIds.length &&
        parentIds.every((id) => l.parentIds.includes(id)),
    );

  it('lights only the focused child of a family, and the couples within the line', () => {
    const hl = highlight(familieBrandt, layout, focusSet(familieBrandt, 'p_peter'));
    expect([...hl.couples].sort()).toEqual(['u_1', 'u_2', 'u_3', 'u_5']);
    const karlErna = hl.childLines[lineOf(['p_karl', 'p_erna'])];
    expect(karlErna?.stems).toEqual([true]);
    expect([...(karlErna?.drops ?? [])]).toEqual(['p_peter']);
    expect([...(hl.childLines[lineOf(['p_peter', 'p_sabine'])]?.drops ?? [])].sort()).toEqual([
      'p_felix',
      'p_lena',
    ]);
    // Karl's second marriage and Thomas, Peter's half brother, are not part of Peter's line.
    expect(hl.couples.has('u_4')).toBe(false);
    expect(hl.childLines[lineOf(['p_karl', 'p_hildegard'])]?.stems).toEqual([false]);
  });

  it('includes adoptive lines of descendants', () => {
    const hl = highlight(familieBrandt, layout, focusSet(familieBrandt, 'p_karl'));
    const adoptive = layout.childLines.findIndex((l) => l.kind === 'adoptive');
    expect(adoptive).toBeGreaterThanOrEqual(0);
    expect(hl.childLines[adoptive]?.drops.has('p_jonas')).toBe(true);
  });

  it("lights the half of a descendant's couple line up to where the lit line to their child starts", () => {
    // Karl selected: his son Peter is in his line, Peter's former wife Sabine is not, their children are.
    const hl = highlight(familieBrandt, layout, focusSet(familieBrandt, 'p_karl'));
    expect(hl.couples.has('u_5')).toBe(false);
    expect(hl.halves.get('u_5')).toBe('p_peter');
    const line = layout.coupleLines.find((l) => l.partnershipId === 'u_5')!;
    const peter = layout.cards.find((c) => c.id === 'p_peter')!;
    const half = halfCouple(line, peter);
    expect(half.at(-1)).toEqual(line.middle);
    expect(Math.abs(half[0]!.x - peter.x)).toBe(peter.width / 2);
  });

  it('lights no half couple line when both partners are in the line or no child line is lit', () => {
    expect(highlight(familieBrandt, layout, focusSet(familieBrandt, 'p_peter')).halves.size).toBe(
      0,
    );
    // Sabine selected: Peter is her partner, so their couple line is fully lit.
    const hl = highlight(familieBrandt, layout, focusSet(familieBrandt, 'p_sabine'));
    expect(hl.couples.has('u_5')).toBe(true);
    expect(hl.halves.has('u_5')).toBe(false);
  });

  it('lights only the stem of the parent in the line when the parents have no couple line', () => {
    // Alex and Dora are not neighbours (Cora stands between them), so each has a stem to their children.
    const project = family('dora-has-a-mother', (f) => {
      f.persons('alex:1940 bea:1942 cora:1945 dora:1950 kid3:1982 mum:1925');
      f.couple('alex', 'bea');
      f.couple('alex', 'cora');
      f.couple('alex', 'dora');
      f.children(['alex', 'dora'], 'kid3');
      f.children(['mum'], 'dora');
    });
    const tree = computeLayout(project);
    const i = tree.childLines.findIndex((l) => l.parentIds.join(' ') === 'alex dora');
    expect(tree.childLines[i]?.stems).toHaveLength(2);
    const hl = highlight(project, tree, focusSet(project, 'mum'));
    expect(hl.childLines[i]?.stems).toEqual([false, true]);
    expect(hl.halves.size).toBe(0);
  });
});
