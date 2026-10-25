/**
 * Step 3 of the layout: x positions. Blocks (partners in a row) are rigid. Row by row, down and up again,
 * every block is pulled towards its members' parents and towards the middle of its children; a small solver then
 * puts the row's blocks as close to those wishes as possible while keeping their order and the minimum gaps.
 */
import { get, mean, type FamilyGraph } from './graph';
import type { RowOrder } from './order';
import type { PersonId } from '../model/types';

const ITERATIONS = 30;
/** Weight of a block with no relatives above or below: it stays where it is unless pushed. */
const IDLE_WEIGHT = 0.01;

/** Centre x of every person. `width` is a card's width, `gap` the space required between two neighbours. */
export function placeRows(
  graph: FamilyGraph,
  order: RowOrder,
  width: (id: PersonId) => number,
  gap: (a: PersonId, b: PersonId) => number,
): Map<PersonId, number> {
  const distance = (a: PersonId, b: PersonId) => (width(a) + width(b)) / 2 + gap(a, b);
  // Centre of each member relative to the centre of the block's first member.
  const offset = new Map<PersonId, number>();
  for (const row of order)
    for (const block of row)
      block.forEach((id, i) =>
        offset.set(id, i ? get(offset, get(block, i - 1)) + distance(get(block, i - 1), id) : 0),
      );
  // Minimum distance from one block's first member to the next block's first member.
  const spacing = (row: PersonId[][]) =>
    row.slice(1).map((block, i) => {
      const before = get(row, i);
      const last = get(before, before.length - 1);
      return get(offset, last) + distance(last, get(block, 0));
    });

  const x = new Map<PersonId, number>();
  const setStarts = (row: PersonId[][], starts: number[]) =>
    row.forEach((block, i) => block.forEach((id) => x.set(id, get(starts, i) + get(offset, id))));
  for (const row of order) {
    const starts = [0];
    for (const s of spacing(row)) starts.push(get(starts, starts.length - 1) + s);
    setStarts(row, starts);
  }

  // What each block is pulled towards, worked out once: its members' parents, and per set of parents in the
  // block their children (whose middle they should stand above).
  const pulls = new Map(
    order.flat().map((block) => {
      const ups = block.flatMap((id) => {
        const parents = get(graph.parents, id);
        return parents.length ? [{ id, parents }] : [];
      });
      const families = new Map<string, { parents: PersonId[]; kids: PersonId[] }>();
      for (const id of block)
        for (const kid of get(graph.children, id)) {
          const parents = get(graph.parents, kid).filter((p) => block.includes(p));
          const key = parents.join(' ');
          const family = families.get(key) ?? { parents, kids: [] };
          family.kids.push(kid);
          families.set(key, family);
        }
      const downs = [...families.values()].map(({ parents, kids }) => ({
        kids,
        offset: mean(parents.map((p) => get(offset, p))) ?? 0,
      }));
      return [block, { ups, downs }] as const;
    }),
  );
  const wish = (block: PersonId[]): [number, number] => {
    const { ups, downs } = get(pulls, block);
    const wishes: number[] = [];
    for (const { id, parents } of ups)
      wishes.push((mean(parents.map((p) => get(x, p))) ?? 0) - get(offset, id));
    // One wish per set of parents in this block: their middle above the middle of their children.
    for (const { kids, offset: at } of downs) {
      const xs = kids.map((kid) => get(x, kid));
      wishes.push((Math.min(...xs) + Math.max(...xs)) / 2 - at);
    }
    const value = mean(wishes);
    return value === undefined ? [get(x, get(block, 0)), IDLE_WEIGHT] : [value, wishes.length];
  };

  const rowIndices = order.map((_, r) => r);
  const sweep = [...rowIndices, ...rowIndices.slice(0, -1).reverse()];
  for (let i = 0; i < ITERATIONS; i++)
    for (const r of sweep) {
      const row = get(order, r);
      const wishes = row.map(wish);
      setStarts(
        row,
        closestInOrder(
          wishes.map(([w]) => w),
          wishes.map(([, weight]) => weight),
          spacing(row),
        ),
      );
    }
  return x;
}

/**
 * Positions as close as possible to `wanted` (weighted least squares) that keep the order and at least
 * `spacing[i]` between position i and i + 1. Shifting by the cumulative spacing turns this into "keep the values
 * non-decreasing", solved by pooling neighbours that are out of order (pool adjacent violators).
 */
export function closestInOrder(wanted: number[], weights: number[], spacing: number[]): number[] {
  const shift = [0];
  for (const s of spacing) shift.push(get(shift, shift.length - 1) + s);
  const pools: { value: number; weight: number; count: number }[] = [];
  wanted.forEach((w, i) => {
    pools.push({ value: w - get(shift, i), weight: get(weights, i), count: 1 });
    for (;;) {
      const a = pools.at(-2);
      const b = pools.at(-1);
      if (!a || !b || a.value <= b.value) break;
      const weight = a.weight + b.weight;
      const value = (a.value * a.weight + b.value * b.weight) / weight;
      pools.splice(-2, 2, { value, weight, count: a.count + b.count });
    }
  });
  return pools
    .flatMap((p) => Array.from({ length: p.count }, () => p.value))
    .map((v, i) => v + get(shift, i));
}
