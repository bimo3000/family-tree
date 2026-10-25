/**
 * Step 4 of the layout: the lines between the cards, following the mock-up's drawing rules (ui-concept §3).
 * Partners get a couple line. Children hang from the middle of their parents' couple line, or from below each
 * parent when there is no such line. Biological parents share one solid line; every other kind of parent gets
 * its own dashed line, so a child can show both (TREE-03). Special marks appear only where they apply (TREE-04).
 * A line that still crosses another one gets a small break in its horizontal piece, so a crossing never looks
 * like a junction.
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

/** Children grouped by the parents they hang from, one group per drawn child line. */
export interface LineGroup {
  kind: OtherKind | undefined;
  parentIds: PersonId[];
  kids: PersonId[];
}

/**
 * The child lines to draw, by key (mock-up `edgesHtml`): biological parents who are a couple share one line,
 * every other parent gets a line of their own. The layout also uses them for the passages of long lines.
 */
export function lineGroups(project: Project): Map<string, LineGroup> {
  const couples = new Set(project.partnerships.map((r) => pairKey(...r.partners)));
  const groups = new Map<string, LineGroup>();
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
  return groups;
}

/**
 * `passages` holds, per line into a child that sits more than one row below its parents (key `group>child`),
 * the x where the line passes each row in between (see passages.ts).
 */
export function drawLines(
  project: Project,
  cards: Map<PersonId, CardBox>,
  sizes: LayoutSizes,
  passages: Map<string, number[]>,
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

  const groups = lineGroups(project);

  // A child with several incoming lines (e.g. biological and adoptive) gets them side by side.
  const entryX = new Map<string, number>();
  const incoming = new Map<PersonId, string[]>();
  for (const [key, { kids }] of groups)
    for (const kid of kids) incoming.set(kid, [...(incoming.get(kid) ?? []), key]);
  for (const [kid, keys] of incoming)
    keys.forEach((key, i) =>
      entryX.set(`${key}>${kid}`, get(cards, kid).x + (i - (keys.length - 1) / 2) * ENTRY_STEP),
    );

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
      // Rows between the parents and a child further down are passed at the passages' x.
      const via = passages.get(`${key}>${childId}`) ?? [];
      const last = via.at(-1);
      // The last passage almost right above the child's only line: straight down instead of a tiny step.
      if (
        last !== undefined &&
        get(incoming, childId).length === 1 &&
        Math.abs(last - x) <= card.width / 4
      )
        x = last;
      // One horizontal piece in every gap below the passed rows, from one passage to the next (or to the child).
      const pieces = via.map((from, i) => {
        const to = via[i + 1] ?? x;
        return {
          base: base + (i + 1) * sizes.rowHeight,
          left: Math.min(from, to),
          right: Math.max(from, to),
        };
      });
      return { childId, card, x, via, pieces };
    });
    const xs = [...origins.map((o) => o.x), hubX, ...drops.map((d) => d.via[0] ?? d.x)];
    return {
      kind,
      parentIds,
      origins,
      hubX,
      drops,
      bar: { base, left: Math.min(...xs), right: Math.max(...xs) },
    };
  });

  // Overlapping horizontal pieces in the same gap get different levels, so each child's line stays traceable.
  type Bar = { base: number; left: number; right: number };
  const bars: Bar[] = plans.flatMap((p) => [
    p.bar,
    ...p.drops.flatMap((d) => d.pieces.filter((piece) => piece.left < piece.right)),
  ]);
  const lane = new Map<Bar, number>();
  for (const base of new Set(bars.map((b) => b.base))) {
    const ends: number[] = [];
    for (const bar of bars.filter((b) => b.base === base).sort((a, b) => a.left - b.left)) {
      let i = ends.findIndex((end) => end < bar.left - CLEARANCE);
      if (i < 0) i = ends.length;
      ends[i] = bar.right;
      lane.set(bar, get(LANES, Math.min(i, LANES.length - 1)) * LANE_STEP);
    }
  }
  const level = (bar: Bar) => bar.base + (lane.get(bar) ?? 0);

  const childLines: ChildLine[] = plans.map((plan) => {
    const busY = level(plan.bar);
    const hub = { x: plan.hubX, y: busY };
    return {
      parentIds: plan.parentIds,
      ...(plan.kind ? { kind: plan.kind } : {}),
      stems: plan.origins.map((o) => path([o, { x: o.x, y: busY }, hub])),
      drops: plan.drops.map(({ childId, card, x, via, pieces }) => {
        const points = [hub];
        let y = busY;
        via.forEach((gapX, i) => {
          points.push({ x: gapX, y });
          y = level(get(pieces, i));
          points.push({ x: gapX, y });
        });
        points.push({ x, y }, { x, y: card.y - card.height / 2 });
        return { childId, points: path(points) };
      }),
    };
  });
  const coupleLines = [...couples.values()];
  markCrossings(coupleLines, childLines);
  return { coupleLines, childLines };
}

/**
 * Where a vertical piece of one line crosses a horizontal piece of another, the horizontal one gets a break
 * there (drawn as a small gap). Lines of the same family meet at junctions, which are no crossings.
 */
function markCrossings(coupleLines: CoupleLine[], childLines: ChildLine[]): void {
  const owners: { owner: CoupleLine | ChildLine; paths: Point[][] }[] = [
    ...coupleLines.map((l) => ({ owner: l, paths: [l.points] })),
    ...childLines.map((l) => ({ owner: l, paths: [...l.stems, ...l.drops.map((d) => d.points)] })),
  ];
  const pieces = owners.flatMap(({ owner, paths }) =>
    paths.flatMap((points) => points.slice(1).map((b, i) => ({ owner, a: get(points, i), b }))),
  );
  const horizontal = pieces.filter(({ a, b }) => a.y === b.y && a.x !== b.x);
  const vertical = pieces.filter(({ a, b }) => a.x === b.x && a.y !== b.y);
  for (const h of horizontal)
    for (const v of vertical) {
      const { x } = v.a;
      const { y } = h.a;
      if (
        h.owner !== v.owner &&
        x > Math.min(h.a.x, h.b.x) &&
        x < Math.max(h.a.x, h.b.x) &&
        y > Math.min(v.a.y, v.b.y) &&
        y < Math.max(v.a.y, v.b.y)
      ) {
        const breaks = (h.owner.breaks ??= []);
        if (!breaks.some((p) => p.x === x && p.y === y)) breaks.push({ x, y });
      }
    }
}

function pairKey(a: PersonId, b: PersonId): string {
  return a < b ? `${a} ${b}` : `${b} ${a}`;
}

/** The points without repeats, so a straight line isn't split into zero-length pieces. */
function path(points: Point[]): Point[] {
  return points.filter((p, i) => i === 0 || p.x !== points[i - 1]?.x || p.y !== points[i - 1]?.y);
}
