/**
 * Step 2 of the layout: the left-to-right order inside each row. Partners in the same row form a block that
 * always stays together. A depth-first walk gives a natural first order (siblings by birth, every family below its
 * parents); a few barycenter sweeps then move blocks to reduce crossing lines, keeping the best order found,
 * and swapping neighbours removes what is left where it can.
 */
import { compareByBirth, get, mean, type FamilyGraph } from './graph';
import type { PersonId } from '../model/types';

/** Per row, the blocks left to right; a block is a person with their partners in that row, left to right. */
export type RowOrder = PersonId[][][];

const SWEEPS = 4;

export function orderRows(graph: FamilyGraph, rowOf: Map<PersonId, number>): RowOrder {
  const blocks = buildBlocks(graph, rowOf);
  const blockOf = new Map<PersonId, number>();
  blocks.forEach((members, b) => members.forEach((id) => blockOf.set(id, b)));
  const rowCount = Math.max(...rowOf.values()) + 1;
  let rows = initialOrder(graph, rowOf, blocks, blockOf, rowCount);

  const snapshot = () => ({ rows: rows.map((r) => [...r]), blocks: blocks.map((m) => [...m]) });
  let best = snapshot();
  let fewest = crossings(graph, rowOf, blocks, rows);
  const keepIfBetter = () => {
    const count = crossings(graph, rowOf, blocks, rows);
    if (count < fewest) {
      fewest = count;
      best = snapshot();
    }
  };
  for (let i = 0; i < SWEEPS && fewest > 0; i++) {
    for (let r = 1; r < rowCount; r++) reorderRow(graph, blocks, rows, r, 'parents');
    keepIfBetter();
    for (let r = rowCount - 2; r >= 0; r--) reorderRow(graph, blocks, rows, r, 'children');
    keepIfBetter();
  }
  rows = best.rows;
  swapNeighbours(graph, rowOf, best.blocks, rows);
  return rows.map((r) => r.map((b) => get(best.blocks, b)));
}

/**
 * Final polish: swap neighbouring blocks wherever that removes crossings. Plain siblings are never swapped,
 * because swapping them changes nothing, so they keep their birth order.
 */
function swapNeighbours(
  graph: FamilyGraph,
  rowOf: Map<PersonId, number>,
  blocks: PersonId[][],
  rows: number[][],
): void {
  let count = crossings(graph, rowOf, blocks, rows);
  for (let improved = true; improved && count > 0;) {
    improved = false;
    for (const row of rows)
      for (let i = 0; i + 1 < row.length; i++) {
        row.splice(i, 2, get(row, i + 1), get(row, i));
        const swapped = crossings(graph, rowOf, blocks, rows);
        if (swapped < count) {
          count = swapped;
          improved = true;
        } else row.splice(i, 2, get(row, i + 1), get(row, i));
      }
  }
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
 * Depth-first from the top: place a block, then the parents of its members that are still missing (in-laws),
 * then all its children's blocks (in the order of their parents in the block, then by birth), then go deeper.
 */
function initialOrder(
  graph: FamilyGraph,
  rowOf: Map<PersonId, number>,
  blocks: PersonId[][],
  blockOf: Map<PersonId, number>,
  rowCount: number,
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
    for (const id of members)
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
  for (const b of starts) if (place(b)) visit(b);
  return rows;
}

/**
 * One barycenter step: every block moves to the average position of its members' parents (or children).
 * A block is mirrored when that fits its neighbours better. Blocks without such relatives keep their place;
 * ties keep siblings in birth order.
 */
function reorderRow(
  graph: FamilyGraph,
  blocks: PersonId[][],
  rows: number[][],
  r: number,
  towards: 'parents' | 'children',
): void {
  const pos = positions(blocks, rows);
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
        row.indexOf(a) - row.indexOf(b),
    );
  rows[r] = row.map((b) => (bary.has(b) ? (movable.shift() ?? b) : b));
}

/** Lines between neighbouring rows that cross: each child is linked to the middle of its parents in the row above. */
function crossings(
  graph: FamilyGraph,
  rowOf: Map<PersonId, number>,
  blocks: PersonId[][],
  rows: number[][],
): number {
  const pos = positions(blocks, rows);
  let count = 0;
  for (let r = 1; r < rows.length; r++) {
    const edges: [number, number][] = [];
    for (const b of get(rows, r))
      for (const id of get(blocks, b)) {
        const above = mean(
          get(graph.parents, id)
            .filter((p) => get(rowOf, p) === r - 1)
            .map((p) => get(pos, p)),
        );
        if (above !== undefined) edges.push([above, get(pos, id)]);
      }
    for (let i = 0; i < edges.length; i++)
      for (let j = i + 1; j < edges.length; j++) {
        const [a1, b1] = get(edges, i);
        const [a2, b2] = get(edges, j);
        if ((a1 - a2) * (b1 - b2) < 0) count++;
      }
  }
  return count;
}

/** Index of every person within their row. */
function positions(blocks: PersonId[][], rows: number[][]): Map<PersonId, number> {
  const pos = new Map<PersonId, number>();
  for (const row of rows) row.flatMap((b) => get(blocks, b)).forEach((id, i) => pos.set(id, i));
  return pos;
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
