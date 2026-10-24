import { describe, expect, it } from 'vitest';
import { computeLayout } from '../../../src/core/layout';
import { focusSet } from '../../../src/core/model/queries';
import {
  centerOn,
  endMarkD,
  fitView,
  highlight,
  isOnScreen,
  MAX_ZOOM,
  MIN_ZOOM,
  pathD,
  zoomAt,
} from '../../../src/ui/tree/geometry';
import { familieBrandt } from '../../fixtures/familie-brandt';

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

  it('draws the "//" around the given point', () => {
    expect(endMarkD({ x: 100, y: 50 })).toBe('M93 57 L99 43 M101 57 L107 43');
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
    expect(karlErna?.stems).toBe(true);
    expect([...(karlErna?.drops ?? [])]).toEqual(['p_peter']);
    expect([...(hl.childLines[lineOf(['p_peter', 'p_sabine'])]?.drops ?? [])].sort()).toEqual([
      'p_felix',
      'p_lena',
    ]);
    // Karl's second marriage and Thomas, Peter's half brother, are not part of Peter's line.
    expect(hl.couples.has('u_4')).toBe(false);
    expect(hl.childLines[lineOf(['p_karl', 'p_hildegard'])]?.stems).toBe(false);
  });

  it('includes adoptive lines of descendants', () => {
    const hl = highlight(familieBrandt, layout, focusSet(familieBrandt, 'p_karl'));
    const adoptive = layout.childLines.findIndex((l) => l.kind === 'adoptive');
    expect(adoptive).toBeGreaterThanOrEqual(0);
    expect(hl.childLines[adoptive]?.drops.has('p_jonas')).toBe(true);
  });
});
