import { describe, expect, it } from 'vitest';
import {
  computeLayout,
  DEFAULT_SIZES,
  type ChildLine,
  type Layout,
  type Point,
} from '../../../src/core/layout';
import {
  brandt,
  mismatchedGenerations,
  simple,
  stepFather,
  threePartners,
  uncleNiece,
} from '../../fixtures/layout-families';

const card = (layout: Layout, id: string) => layout.cards.find((c) => c.id === id)!;
const childLine = (layout: Layout, parentIds: string[], kind?: string): ChildLine =>
  layout.childLines.find((l) => l.parentIds.join(' ') === parentIds.join(' ') && l.kind === kind)!;
const couple = (layout: Layout, id: string) =>
  layout.coupleLines.find((l) => l.partnershipId === id)!;

describe('couple lines', () => {
  it('run from card edge to card edge, with no marks for a simple couple (TREE-04)', () => {
    const layout = computeLayout(simple);
    const anna = card(layout, 'anna');
    const bernd = card(layout, 'bernd');
    expect(layout.coupleLines).toEqual([
      {
        partnershipId: 'u_1',
        points: [
          { x: anna.x + anna.width / 2, y: anna.y },
          { x: bernd.x - bernd.width / 2, y: bernd.y },
        ],
        middle: { x: (anna.x + bernd.x) / 2, y: anna.y },
      },
    ]);
  });

  it('carry the end reason of a divorce for the "//" mark', () => {
    expect(couple(computeLayout(brandt), 'u_5').ended).toBe('divorce');
  });

  it('arch over the cards between partners who are not neighbours', () => {
    const layout = computeLayout(threePartners);
    const line = couple(layout, 'u_3'); // Alex and Dora, Cora stands between them
    expect(line.points).toHaveLength(4);
    expect(line.middle.y).toBeLessThan(card(layout, 'cora').y - card(layout, 'cora').height / 2);
  });
});

describe('child lines', () => {
  it('hang all children of a couple from the middle of the couple line', () => {
    const layout = computeLayout(simple);
    expect(layout.childLines).toHaveLength(1);
    const line = layout.childLines[0]!;
    expect(line.kind).toBeUndefined();
    expect(line.stems).toHaveLength(1);
    expect(line.stems[0]![0]).toEqual(couple(layout, 'u_1').middle);
    expect(line.drops.map((d) => d.childId)).toEqual(['clara', 'david', 'emil']);
    for (const drop of line.drops) {
      const kid = card(layout, drop.childId);
      expect(drop.points.at(-1)).toEqual({ x: kid.x, y: kid.y - kid.height / 2 });
    }
  });

  it('start below the "//" mark of divorced parents', () => {
    const layout = computeLayout(brandt);
    const line = childLine(layout, ['p_peter', 'p_sabine']);
    expect(line.stems[0]![0]!.y).toBe(couple(layout, 'u_5').middle.y + 11);
  });

  it('are dashed only for adoptive, step and foster links', () => {
    const layout = computeLayout(brandt);
    expect(layout.childLines.filter((l) => l.kind).map((l) => l.kind)).toEqual(['adoptive']);
    expect(childLine(layout, ['p_ingrid', 'p_michael'], 'adoptive').drops[0]!.childId).toBe(
      'p_jonas',
    );
  });

  it('start below the "?" node of an unknown parent', () => {
    const layout = computeLayout(brandt);
    const unknown = card(layout, 'p_unbekannt');
    expect(unknown.placeholder).toBe(true);
    expect(unknown.width).toBe(DEFAULT_SIZES.unknownSize);
    expect(childLine(layout, ['p_unbekannt']).stems[0]![0]).toEqual({
      x: unknown.x,
      y: unknown.y + DEFAULT_SIZES.unknownSize / 2,
    });
  });

  it('run straight down to an only child right below its parents', () => {
    const layout = computeLayout(brandt);
    const drop = childLine(layout, ['p_wilhelm', 'p_elise']).drops[0]!;
    expect(drop.points).toHaveLength(2);
    expect(drop.points[0]!.x).toBe(drop.points[1]!.x);
  });

  it('arrive side by side when a child has a biological and a step parent', () => {
    const layout = computeLayout(stepFather);
    const solid = childLine(layout, ['mother', 'father']).drops[0]!.points.at(-1)!;
    const dashed = childLine(layout, ['step'], 'step').drops[0]!.points.at(-1)!;
    expect(dashed.y).toBe(solid.y);
    expect(Math.abs(dashed.x - solid.x)).toBe(16);
  });

  it('put overlapping bars at different heights, so every child line stays traceable', () => {
    const layout = computeLayout(threePartners);
    const busY = (l: ChildLine) => l.drops[0]!.points[0]!.y;
    expect(busY(childLine(layout, ['alex', 'cora']))).not.toBe(
      busY(childLine(layout, ['alex', 'dora'])),
    );
  });

  it('draw parents who are no couple with a line from each of them', () => {
    const layout = computeLayout(threePartners);
    expect(childLine(layout, ['alex', 'dora']).stems).toHaveLength(2);
  });

  it('pass a skipped row in a gap of their own and enter the child straight', () => {
    const layout = computeLayout(uncleNiece);
    const [hub, ...rest] = childLine(layout, ['gpa', 'gma']).drops.find(
      (d) => d.childId === 'uncle',
    )!.points;
    const uncle = card(layout, 'uncle');
    const inlaw = card(layout, 'inlaw');
    // Over to the gap, then straight down past the row of the sister and her husband, into the uncle's card.
    expect(rest[0]!.y).toBe(hub!.y);
    expect(new Set(rest.map((p) => p.x)).size).toBe(1);
    expect(rest.at(-1)!.y).toBe(uncle.y - uncle.height / 2);
    expect(rest[0]!.x - (inlaw.x + inlaw.width / 2)).toBeGreaterThanOrEqual(24);
  });
});

describe('crossings', () => {
  it("break the horizontal line where another family's line crosses it", () => {
    const layout = computeLayout(mismatchedGenerations);
    const broken = layout.childLines.filter((l) => l.breaks);
    expect(broken).toHaveLength(1);
    const [line] = broken as [ChildLine];
    expect(line.breaks).toHaveLength(1);
    const point = line.breaks![0]!;
    const on = (points: Point[], vertical: boolean) =>
      points.slice(1).some((b, i) => {
        const a = points[i]!;
        return vertical
          ? a.x === b.x &&
              a.x === point.x &&
              Math.min(a.y, b.y) < point.y &&
              Math.max(a.y, b.y) > point.y
          : a.y === b.y &&
              a.y === point.y &&
              Math.min(a.x, b.x) < point.x &&
              Math.max(a.x, b.x) > point.x;
      });
    const paths = (l: ChildLine) => [...l.stems, ...l.drops.map((d) => d.points)];
    expect(paths(line).some((p) => on(p, false))).toBe(true);
    const others = layout.childLines.filter((l) => l !== line);
    expect(others.some((l) => paths(l).some((p) => on(p, true)))).toBe(true);
  });

  it('leave no break marks in a family without crossings (TREE-04)', () => {
    const layout = computeLayout(brandt);
    expect(layout.childLines.some((l) => 'breaks' in l)).toBe(false);
    expect(layout.coupleLines.some((l) => 'breaks' in l)).toBe(false);
  });
});
