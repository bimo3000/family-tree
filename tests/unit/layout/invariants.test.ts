// Rules every layout must keep, checked on every fixture family (ADR-0006).
import { describe, expect, it } from 'vitest';
import {
  computeLayout,
  DEFAULT_SIZES,
  type CardBox,
  type Layout,
  type Point,
} from '../../../src/core/layout';
import { addPerson, addPartnership } from '../../../src/core/model/operations';
import { addChild } from '../../../src/core/model/relatives';
import { connectedComponent, parentLinksOf, partnershipsOf } from '../../../src/core/model/queries';
import { dateSortKey } from '../../../src/core/dates';
import {
  allFamilies,
  brandt,
  disconnected,
  generatedFamily,
  simple,
} from '../../fixtures/layout-families';

/** How often lines of different child lines cross each other in the drawing. Touching does not count. */
function lineCrossings(layout: Layout): number {
  const segments = (points: Point[]) => points.slice(1).map((p, i) => [points[i]!, p] as const);
  const side = (p: Point, q: Point, r: Point) =>
    Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  const families = layout.childLines.map((l) =>
    [...l.stems, ...l.drops.map((d) => d.points)].flatMap(segments),
  );
  let count = 0;
  families.forEach((mine, i) =>
    families.slice(i + 1).forEach((theirs) => {
      for (const [a, b] of mine)
        for (const [c, d] of theirs)
          if (side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0) count++;
    }),
  );
  return count;
}

/** Does the axis-parallel segment a–b run through the inside of the card? Touching an edge is fine. */
function crosses(a: Point, b: Point, c: CardBox): boolean {
  const [left, right] = [c.x - c.width / 2 + 0.5, c.x + c.width / 2 - 0.5];
  const [top, bottom] = [c.y - c.height / 2 + 0.5, c.y + c.height / 2 - 0.5];
  return (
    Math.max(a.x, b.x) > left &&
    Math.min(a.x, b.x) < right &&
    Math.max(a.y, b.y) > top &&
    Math.min(a.y, b.y) < bottom
  );
}

describe.each(allFamilies.map((p) => [p.name, p] as const))('layout of %s', (_, project) => {
  const layout = computeLayout(project);
  const card = new Map(layout.cards.map((c) => [c.id, c]));
  const at = (id: string) => card.get(id)!;

  it('has a card for every person', () => {
    expect(layout.cards.map((c) => c.id)).toEqual(project.persons.map((p) => p.id));
  });

  it('never lets cards overlap', () => {
    for (const a of layout.cards)
      for (const b of layout.cards)
        if (a !== b && a.y === b.y)
          expect(Math.abs(a.x - b.x)).toBeGreaterThanOrEqual(
            (a.width + b.width) / 2 + DEFAULT_SIZES.gap - 1e-6,
          );
  });

  it('puts every parent above every child', () => {
    for (const l of project.parentChild) expect(at(l.parentId).y).toBeLessThan(at(l.childId).y);
  });

  it('keeps partners next to each other (only their other partners in between)', () => {
    for (const r of project.partnerships) {
      const [a, b] = r.partners.map(at);
      if (a!.y !== b!.y) continue;
      const allowed = new Set(
        r.partners.flatMap((id) => partnershipsOf(project, id).flatMap((q) => q.partners)),
      );
      const between = layout.cards.filter(
        (c) => c.y === a!.y && c.x > Math.min(a!.x, b!.x) && c.x < Math.max(a!.x, b!.x),
      );
      for (const c of between) expect(allowed).toContain(c.id);
    }
  });

  it('sorts siblings by birth unless a partner brings their own parents', () => {
    const hasInLaws = (id: string) =>
      partnershipsOf(project, id).some((r) =>
        r.partners.some((p) => p !== id && parentLinksOf(project, p).length > 0),
      );
    const families = new Map<string, string[]>();
    for (const p of project.persons) {
      const key = parentLinksOf(project, p.id)
        .map((l) => l.parentId)
        .sort()
        .join(' ');
      if (key && !hasInLaws(p.id)) families.set(key, [...(families.get(key) ?? []), p.id]);
    }
    const birth = (id: string) =>
      dateSortKey(project.persons.find((p) => p.id === id)?.birth?.date) ?? Infinity;
    for (const kids of families.values()) {
      const byX = [...kids].sort((a, b) => at(a).x - at(b).x);
      const byBirth = [...kids].sort((a, b) => birth(a) - birth(b));
      expect(byX.map(birth)).toEqual(byBirth.map(birth));
    }
  });

  it('draws no child line through a card that is not its own', () => {
    for (const line of layout.childLines)
      for (const points of [...line.stems, ...line.drops.map((d) => d.points)])
        for (let i = 1; i < points.length; i++)
          for (const c of layout.cards)
            expect(
              crosses(points[i - 1]!, points[i]!, c),
              `${line.parentIds} through ${c.id}`,
            ).toBe(false);
  });

  it('fits every card into width and height', () => {
    for (const c of layout.cards) {
      expect(c.x - c.width / 2).toBeGreaterThanOrEqual(-1e-6);
      expect(c.x + c.width / 2).toBeLessThanOrEqual(layout.width + 1e-6);
      expect(c.y + c.height / 2).toBeLessThanOrEqual(layout.height + 1e-6);
    }
  });

  it('is deterministic', () => {
    expect(computeLayout(project)).toEqual(layout);
  });
});

describe('layout as a whole', () => {
  it('places unrelated parts side by side without overlap', () => {
    const layout = computeLayout(disconnected);
    const span = (start: string) => {
      const xs = [...connectedComponent(disconnected, start)].map(
        (id) => layout.cards.find((c) => c.id === id)!.x,
      );
      return [Math.min(...xs) - 75, Math.max(...xs) + 75] as const;
    };
    const parts = [span('a1'), span('loner'), span('b1')].sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < parts.length; i++)
      expect(parts[i]![0]).toBeGreaterThanOrEqual(parts[i - 1]![1]);
  });

  it('draws Familie Brandt without crossing lines', () => {
    expect(lineCrossings(computeLayout(brandt))).toBe(0);
  });

  it('lets two families pass each other to avoid a crossing (user report, S4)', () => {
    // Two new children of Wilhelm and Elise Kühn are a couple with a child. Their family and the "?" above
    // Michael Seidel tie for the same place; they must end up in the order without a crossing line.
    let project = brandt;
    const add = (name: string, parents: string[]) => {
      const added = addPerson(project, { givenNames: name });
      project = addChild(added.project, parents, { existingId: added.id }).project;
      return added.id;
    };
    const a = add('Anna', ['p_wilhelm', 'p_elise']);
    const b = add('Bernd', ['p_wilhelm', 'p_elise']);
    project = addPartnership(project, a, b).project;
    add('Clara', [a, b]);
    expect(lineCrossings(computeLayout(project))).toBe(0);
  });

  it('lays out an empty project', () => {
    expect(computeLayout({ ...simple, persons: [], partnerships: [], parentChild: [] })).toEqual({
      cards: [],
      coupleLines: [],
      childLines: [],
      width: 0,
      height: 0,
    });
  });

  it('lays out 100 persons quickly (TREE-05)', () => {
    const project = generatedFamily(100);
    expect(project.persons).toHaveLength(100);
    computeLayout(project); // warm-up
    const start = performance.now();
    computeLayout(project);
    expect(performance.now() - start).toBeLessThan(100);
  });
});
