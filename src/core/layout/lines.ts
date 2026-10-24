/**
 * Step 4 of the layout: the lines between the cards, following the mock-up's drawing rules (ui-concept §3).
 * Partners get a couple line. Children hang from the middle of their parents' couple line, or from below each
 * parent when there is no such line. Biological parents share one solid line; every other kind of parent gets
 * its own dashed line, so a child can show both (TREE-03). Special marks appear only where they apply (TREE-04).
 */
import { get, mean } from './graph';
import { isBiological } from '../model/queries';
import type { CardBox, ChildLine, CoupleLine, LayoutSizes, Point } from './types';
import type { ParentChildKind, PersonId, Project } from '../model/types';

/** The child line starts this far below a "//" mark, so it doesn't run through it. */
const BELOW_MARK = 11;
/** Child lines whose horizontal bars would overlap get their own level, this far apart. */
const LANE_STEP = 12;
/** Order in which the levels are used, in steps above (-) or below (+) the middle of the gap between rows. */
const LANES = [0, 1, -1, 2, -2];
/** Several lines into one child arrive side by side on the card's top edge, this far apart. */
const ENTRY_STEP = 16;
/** A line passing a row of cards keeps this distance from them. */
const CLEARANCE = 12;
/** A couple line between partners who aren't neighbours arches over the cards in between, this far above them. */
const ARCH_HEIGHT = 16;

type OtherKind = Exclude<ParentChildKind, 'biological'>;

export function drawLines(
  project: Project,
  cards: Map<PersonId, CardBox>,
  sizes: LayoutSizes,
): { coupleLines: CoupleLine[]; childLines: ChildLine[] } {
  const all = [...cards.values()];
  const neighbours = (a: CardBox, b: CardBox) =>
    a.y === b.y &&
    !all.some((c) => c.y === a.y && c.x > Math.min(a.x, b.x) && c.x < Math.max(a.x, b.x));

  const couples = new Map<string, CoupleLine>();
  for (const r of project.partnerships) {
    const [a, b] = r.partners.map((id) => get(cards, id)).sort((p, q) => p.x - q.x) as [
      CardBox,
      CardBox,
    ];
    let points: Point[];
    if (a.y !== b.y) points = [a, b].map(({ x, y }) => ({ x, y }));
    else if (neighbours(a, b))
      points = [
        { x: a.x + a.width / 2, y: a.y },
        { x: b.x - b.width / 2, y: b.y },
      ];
    else {
      const top = a.y - sizes.cardHeight / 2 - ARCH_HEIGHT;
      points = [
        { x: a.x, y: a.y - a.height / 2 },
        { x: a.x, y: top },
        { x: b.x, y: top },
        { x: b.x, y: b.y - b.height / 2 },
      ];
    }
    const first = get(points, 0);
    const last = get(points, points.length - 1);
    const middle =
      points.length === 4
        ? { x: (a.x + b.x) / 2, y: get(points, 1).y }
        : { x: (first.x + last.x) / 2, y: (first.y + last.y) / 2 };
    couples.set(pairKey(a.id, b.id), {
      partnershipId: r.id,
      points,
      middle,
      ...(r.end?.reason ? { ended: r.end.reason } : {}),
    });
  }

  // Group the children by the parents they hang from (mock-up `edgesHtml`).
  const groups = new Map<
    string,
    { kind: OtherKind | undefined; parentIds: PersonId[]; kids: PersonId[] }
  >();
  for (const person of project.persons) {
    const byKind = new Map<OtherKind | undefined, PersonId[]>();
    for (const l of project.parentChild) {
      if (l.childId !== person.id) continue;
      const kind = isBiological(l) ? undefined : (l.kind as OtherKind);
      byKind.set(kind, [...(byKind.get(kind) ?? []), l.parentId]);
    }
    for (const [kind, ids] of byKind) {
      const together = ids.length === 2 && couples.has(pairKey(get(ids, 0), get(ids, 1)));
      for (const parentIds of together ? [ids] : ids.map((id) => [id])) {
        const key = `${kind ?? ''}|${[...parentIds].sort().join(' ')}`;
        const group = groups.get(key) ?? { kind, parentIds, kids: [] };
        group.kids.push(person.id);
        groups.set(key, group);
      }
    }
  }

  // A child with several incoming lines (e.g. biological and adoptive) gets them side by side.
  const entryX = new Map<string, number>();
  const incoming = new Map<PersonId, string[]>();
  for (const [key, { kids }] of groups)
    for (const kid of kids) incoming.set(kid, [...(incoming.get(kid) ?? []), key]);
  for (const [kid, keys] of incoming)
    keys.forEach((key, i) =>
      entryX.set(`${key}>${kid}`, get(cards, kid).x + (i - (keys.length - 1) / 2) * ENTRY_STEP),
    );

  const rowYs = [...new Set(all.map((c) => c.y))].sort((a, b) => a - b);
  // Nearest x to `target` in the row at height `y` that doesn't run through a card.
  const freeX = (y: number, target: number) => {
    const row = all.filter((c) => c.y === y);
    const blocked = (x: number) =>
      row.some((c) => Math.abs(x - c.x) < c.width / 2 + CLEARANCE - 0.5);
    if (!blocked(target)) return target;
    const candidates = row
      .flatMap((c) => [c.x - c.width / 2 - CLEARANCE, c.x + c.width / 2 + CLEARANCE])
      .filter((x) => !blocked(x));
    return candidates.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
  };

  const plans = [...groups].map(([key, { kind, parentIds, kids }]) => {
    const parents = parentIds.map((id) => get(cards, id));
    const couple =
      parentIds.length === 2
        ? couples.get(pairKey(get(parentIds, 0), get(parentIds, 1)))
        : undefined;
    const onCoupleLine = couple && neighbours(get(parents, 0), get(parents, 1));
    const origins = onCoupleLine
      ? [{ x: couple.middle.x, y: couple.middle.y + (couple.ended ? BELOW_MARK : 0) }]
      : parents.map((p) => ({ x: p.x, y: p.y + p.height / 2 }));
    const base = Math.max(...parents.map((p) => p.y)) + sizes.rowHeight / 2;
    const hubX = mean(origins.map((o) => o.x)) ?? 0;
    const drops = kids.map((childId) => {
      const card = get(cards, childId);
      let x = get(entryX, `${key}>${childId}`);
      // An only child almost right below its parents: a straight line instead of a tiny step.
      if (origins.length === 1 && kids.length === 1 && Math.abs(hubX - x) <= card.width / 4)
        x = hubX;
      // Rows between the parents and a child further down are passed through a gap between the cards.
      const passed = rowYs.filter((y) => y > base && y < card.y);
      const firstX = passed.length ? freeX(get(passed, 0), x) : x;
      return { childId, card, x, passed, firstX };
    });
    const xs = [...origins.map((o) => o.x), hubX, ...drops.map((d) => d.firstX)];
    return {
      kind,
      parentIds,
      origins,
      base,
      hubX,
      drops,
      left: Math.min(...xs),
      right: Math.max(...xs),
    };
  });

  // Overlapping horizontal bars in the same gap get different levels, so each child's line stays traceable.
  const lane = new Map<(typeof plans)[number], number>();
  for (const base of new Set(plans.map((p) => p.base))) {
    const ends: number[] = [];
    for (const plan of plans.filter((p) => p.base === base).sort((a, b) => a.left - b.left)) {
      let i = ends.findIndex((end) => end < plan.left - CLEARANCE);
      if (i < 0) i = ends.length;
      ends[i] = plan.right;
      lane.set(plan, get(LANES, Math.min(i, LANES.length - 1)) * LANE_STEP);
    }
  }

  const childLines: ChildLine[] = plans.map((plan) => {
    const busY = plan.base + get(lane, plan);
    const hub = { x: plan.hubX, y: busY };
    return {
      parentIds: plan.parentIds,
      ...(plan.kind ? { kind: plan.kind } : {}),
      stems: plan.origins.map((o) => path([o, { x: o.x, y: busY }, hub])),
      drops: plan.drops.map(({ childId, card, x, passed }) => {
        const points = [hub];
        let y = busY;
        for (const rowY of passed) {
          const gapX = freeX(rowY, x);
          points.push({ x: gapX, y }, { x: gapX, y: rowY + sizes.rowHeight / 2 });
          y = rowY + sizes.rowHeight / 2;
        }
        points.push({ x, y }, { x, y: card.y - card.height / 2 });
        return { childId, points: path(points) };
      }),
    };
  });
  return { coupleLines: [...couples.values()], childLines };
}

function pairKey(a: PersonId, b: PersonId): string {
  return a < b ? `${a} ${b}` : `${b} ${a}`;
}

/** The points without repeats, so a straight line isn't split into zero-length pieces. */
function path(points: Point[]): Point[] {
  return points.filter((p, i) => i === 0 || p.x !== points[i - 1]?.x || p.y !== points[i - 1]?.y);
}
