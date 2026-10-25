/**
 * Step 2 of the layout: the left-to-right order inside each row. Partners in the same row form a block that
 * always stays together. A depth-first walk gives a natural first order (siblings by birth, every family below its
 * parents); a few barycenter sweeps then move blocks to reduce crossing lines, keeping the best order found,
 * and swapping neighbours removes what is left where it can. When crossings remain, the same is tried from a few
 * other first orders, and one of them wins only with fewer crossings.
 */
import { compareByBirth, get, mean, type FamilyGraph } from './graph';
import type { PersonId } from '../model/types';

/** Per row, the blocks left to right; a block is a person with their partners in that row, left to right. */
export type RowOrder = PersonId[][][];

const SWEEPS = 4;

/**
 * Ways to start the depth-first walk: from the top or from the bottom row, visiting a block's in-laws left to right
 * or right to left. Different starts get stuck in different places, e.g. when two branches joined by a marriage
 * must both turn towards each other.
 */
const STARTS = [
  { fromBottom: false, rightFirst: false },
  { fromBottom: false, rightFirst: true },
  { fromBottom: true, rightFirst: false },
  { fromBottom: true, rightFirst: true },
];

export function orderRows(graph: FamilyGraph, rowOf: Map<PersonId, number>): RowOrder {
  let best = optimise(graph, rowOf, get(STARTS, 0));
  for (const start of STARTS.slice(1)) {
    if (best.count === 0) break;
    const next = optimise(graph, rowOf, start);
    if (next.count < best.count) best = next;
  }
  return best.rows;
}

function optimise(
  graph: FamilyGraph,
  rowOf: Map<PersonId, number>,
  start: (typeof STARTS)[number],
): { rows: RowOrder; count: number } {
  const blocks = buildBlocks(graph, rowOf);
  const blockOf = new Map<PersonId, number>();
  blocks.forEach((members, b) => members.forEach((id) => blockOf.set(id, b)));
  const rowCount = Math.max(...rowOf.values()) + 1;
  let rows = initialOrder(graph, rowOf, blocks, blockOf, rowCount, start);
  const above = parentsAbove(graph, rowOf);

  const snapshot = () => ({ rows: rows.map((r) => [...r]), blocks: blocks.map((m) => [...m]) });
  let best = snapshot();
  let fewest = crossings(above, blocks, rows);
  const keepIfBetter = () => {
    const count = crossings(above, blocks, rows);
    if (count < fewest) {
      fewest = count;
      best = snapshot();
    }
  };
  for (let i = 0; i < SWEEPS && fewest > 0; i++) {
    for (let r = 1; r < rowCount; r++) reorderRow(graph, blocks, rows, r, 'parents', false);
    keepIfBetter();
    // Every other upward sweep breaks ties the other way round: two families with the same children
    // position would otherwise never pass each other, even when that removes a crossing further down.
    for (let r = rowCount - 2; r >= 0; r--)
      reorderRow(graph, blocks, rows, r, 'children', i % 2 === 1);
    keepIfBetter();
  }
  rows = best.rows;
  const count = swapNeighbours(above, best.blocks, rows);
  return { rows: rows.map((r) => r.map((b) => get(best.blocks, b))), count };
}

/**
 * Final polish: swap neighbouring blocks wherever that removes crossings. Plain siblings are never swapped,
 * because swapping them changes nothing, so they keep their birth order.
 */
function swapNeighbours(
  above: Map<PersonId, PersonId[]>,
  blocks: PersonId[][],
  rows: number[][],
): number {
  const ids = rows.map((row) => persons(blocks, row));
  const pos = ids.map(indexOf);
  // Crossings between row r - 1 and row r; a swap in row r only changes those of r and r + 1.
  const between = (r: number) =>
    r > 0 && r < rows.length ? rowCrossings(above, get(pos, r - 1), get(ids, r)) : 0;
  const pairs = rows.map((_, r) => between(r));
  let count = pairs.reduce((sum, n) => sum + n, 0);
  const swap = (row: number[], r: number, i: number) => {
    row.splice(i, 2, get(row, i + 1), get(row, i));
    ids[r] = persons(blocks, row);
    pos[r] = indexOf(get(ids, r));
  };
  for (let improved = true; improved && count > 0;) {
    improved = false;
    rows.forEach((row, r) => {
      for (let i = 0; i + 1 < row.length; i++) {
        swap(row, r, i);
        const upper = between(r);
        const lower = between(r + 1);
        const before = get(pairs, r) + (pairs[r + 1] ?? 0);
        if (upper + lower < before) {
          count -= before - upper - lower;
          pairs[r] = upper;
          if (r + 1 < rows.length) pairs[r + 1] = lower;
          improved = true;
        } else swap(row, r, i);
      }
    });
  }
  return count;
}

/**
 * Partners in the same row, arranged in a line: the person with the most partners in the middle, their first
 * partner on the left, later partners on the right in the order of the partnerships. A plain couple keeps data order.
 */
function buildBlocks(graph: FamilyGraph, rowOf: Map<PersonId, number>): PersonId[][] {
  const blocks: PersonId[][] = [];
  const done = new Set<PersonId>();
  const partnersInRow = (id: PersonId) =>
    get(graph.partners, id).filter((p) => get(rowOf, p) === get(rowOf, id));
  for (const start of graph.ids) {
    if (done.has(start)) continue;
    const members = [start];
    for (let i = 0; i < members.length; i++)
      for (const p of partnersInRow(get(members, i))) if (!members.includes(p)) members.push(p);
    const hub = members.reduce((a, b) =>
      partnersInRow(b).length > partnersInRow(a).length ||
      (partnersInRow(b).length === partnersInRow(a).length &&
        get(graph.order, b) < get(graph.order, a))
        ? b
        : a,
    );
    const line = [hub];
    done.add(hub);
    const todo: [PersonId, 'left' | 'right' | 'both'][] = [[hub, 'both']];
    for (let next = todo.shift(); next; next = todo.shift()) {
      const [id, side] = next;
      const fresh = partnersInRow(id).filter((p) => !done.has(p));
      fresh.forEach((p, i) => {
        done.add(p);
        const left = side === 'left' || (side === 'both' && i === 0 && fresh.length > 1);
        if (left) line.unshift(p);
        else line.push(p);
        todo.push([p, left ? 'left' : 'right']);
      });
    }
    blocks.push(line);
  }
  return blocks;
}

/**
 * Depth-first from the top (or bottom): place a block, then the parents of its members that are still missing
 * (in-laws), then all its children's blocks (in the order of their parents in the block, then by birth), then go deeper.
 */
function initialOrder(
  graph: FamilyGraph,
  rowOf: Map<PersonId, number>,
  blocks: PersonId[][],
  blockOf: Map<PersonId, number>,
  rowCount: number,
  { fromBottom, rightFirst }: (typeof STARTS)[number],
): number[][] {
  const rows: number[][] = Array.from({ length: rowCount }, () => []);
  const placed = new Set<number>();
  const place = (b: number): boolean => {
    if (placed.has(b)) return false;
    placed.add(b);
    get(rows, get(rowOf, get(get(blocks, b), 0))).push(b);
    return true;
  };
  const visit = (b: number): void => {
    const members = get(blocks, b);
    for (const id of rightFirst ? [...members].reverse() : members)
      for (const p of get(graph.parents, id)) {
        const pb = get(blockOf, p);
        if (place(pb)) visit(pb);
      }
    const kids = [...new Set(members.flatMap((id) => get(graph.children, id)))];
    const anchor = (kid: PersonId) =>
      mean(members.flatMap((id, i) => (get(graph.parents, kid).includes(id) ? [i] : [])));
    kids.sort((a, c) => (anchor(a) ?? 0) - (anchor(c) ?? 0) || compareByBirth(graph, a, c));
    const fresh = kids.map((kid) => get(blockOf, kid)).filter(place);
    fresh.forEach(visit);
  };
  const starts = blocks
    .map((_, b) => b)
    .sort(
      (a, b) => get(rowOf, get(get(blocks, a), 0)) - get(rowOf, get(get(blocks, b), 0)) || a - b,
    );
  if (fromBottom) starts.reverse();
  for (const b of starts) if (place(b)) visit(b);
  return rows;
}

/**
 * One barycenter step: every block moves to the average position of its members' parents (or children).
 * A block is mirrored when that fits its neighbours better. Blocks without such relatives keep their place;
 * ties keep siblings in birth order, other ties keep the current order (or reverse it with `flipTies`).
 */
function reorderRow(
  graph: FamilyGraph,
  blocks: PersonId[][],
  rows: number[][],
  r: number,
  towards: 'parents' | 'children',
  flipTies: boolean,
): void {
  const pos = new Map<PersonId, number>();
  for (const row of rows) persons(blocks, row).forEach((id, i) => pos.set(id, i));
  const related = towards === 'parents' ? graph.parents : graph.children;
  const memberBary = (id: PersonId) => mean(get(related, id).map((n) => get(pos, n)));
  const row = get(rows, r);
  const bary = new Map<number, number>();
  for (const b of row) {
    const members = get(blocks, b);
    const values = members.map(memberBary);
    if (inversions(values) > inversions([...values].reverse())) members.reverse();
    const value = mean(values.filter((v) => v !== undefined));
    if (value !== undefined) bary.set(b, value);
  }
  const birth = (b: number) =>
    Math.min(
      ...get(blocks, b)
        .filter((id) => get(graph.parents, id).length)
        .map((id) => get(graph.birth, id)),
    );
  const movable = row
    .filter((b) => bary.has(b))
    .sort(
      (a, b) =>
        get(bary, a) - get(bary, b) ||
        (towards === 'parents' ? birth(a) - birth(b) : 0) ||
        (row.indexOf(a) - row.indexOf(b)) * (flipTies ? -1 : 1),
    );
  rows[r] = row.map((b) => (bary.has(b) ? (movable.shift() ?? b) : b));
}

/** Lines between neighbouring rows that cross: each child is linked to the middle of its parents in the row above. */
function crossings(
  above: Map<PersonId, PersonId[]>,
  blocks: PersonId[][],
  rows: number[][],
): number {
  const ids = rows.map((row) => persons(blocks, row));
  let count = 0;
  for (let r = 1; r < rows.length; r++)
    count += rowCrossings(above, indexOf(get(ids, r - 1)), get(ids, r));
  return count;
}

/** Crossing lines between a row (its persons left to right) and the row above it (index of each person). */
function rowCrossings(
  above: Map<PersonId, PersonId[]>,
  upper: Map<PersonId, number>,
  lower: PersonId[],
): number {
  const edges: [number, number][] = [];
  lower.forEach((id, x) => {
    const middle = mean(get(above, id).map((p) => get(upper, p)));
    if (middle !== undefined) edges.push([middle, x]);
  });
  // Two lines cross when their order above and below differ: sort by the upper end, count pairs out of order below.
  edges.sort(([a1, b1], [a2, b2]) => a1 - a2 || b1 - b2);
  return descents(edges.map(([, b]) => b));
}

/** Each person's parents in the row right above (the lines that the crossing count looks at). */
function parentsAbove(graph: FamilyGraph, rowOf: Map<PersonId, number>): Map<PersonId, PersonId[]> {
  return new Map(
    graph.ids.map((id) => [
      id,
      get(graph.parents, id).filter((p) => get(rowOf, p) === get(rowOf, id) - 1),
    ]),
  );
}

/** Pairs i < j with values[i] > values[j]; long lists are counted while merge-sorting them (in place). */
function descents(values: number[]): number {
  if (values.length < 32) {
    let count = 0;
    values.forEach((a, i) => {
      for (let j = i + 1; j < values.length; j++) if (a > get(values, j)) count++;
    });
    return count;
  }
  const left = values.slice(0, values.length >> 1);
  const right = values.slice(values.length >> 1);
  let count = descents(left) + descents(right);
  let i = 0;
  let j = 0;
  for (let k = 0; k < values.length; k++)
    if (j >= right.length || (i < left.length && get(left, i) <= get(right, j)))
      values[k] = get(left, i++);
    else {
      count += left.length - i;
      values[k] = get(right, j++);
    }
  return count;
}

/** The persons of a row, left to right. */
function persons(blocks: PersonId[][], row: number[]): PersonId[] {
  return row.flatMap((b) => get(blocks, b));
}

/** Index of every person within their row. */
function indexOf(ids: PersonId[]): Map<PersonId, number> {
  return new Map(ids.map((id, i) => [id, i]));
}

/** Pairs out of order, ignoring missing values. */
function inversions(values: (number | undefined)[]): number {
  let count = 0;
  values.forEach((a, i) =>
    values.slice(i + 1).forEach((b) => {
      if (a !== undefined && b !== undefined && a > b) count++;
    }),
  );
  return count;
}
