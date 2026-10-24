/**
 * Step 1 of the layout: give every person a row (generation). Partners share a row, siblings share a row,
 * children sit at least one row below each of their parents (links of every kind), and nobody floats higher than needed.
 */
import { get, type FamilyGraph } from './graph';
import type { PersonId } from '../model/types';

/** Row per person, starting at 0 for the top row. */
export function assignRows(graph: FamilyGraph): Map<PersonId, number> {
  const groups = sameRowGroups(graph);
  const groupOf = new Map<PersonId, number>();
  groups.forEach((members, g) => members.forEach((id) => groupOf.set(id, g)));
  const childGroups = groups.map((members) => [
    ...new Set(members.flatMap((id) => get(graph.children, id).map((c) => get(groupOf, c)))),
  ]);

  // Longest path from the top: every group one row below its lowest parent group.
  const topo = topologicalOrder(childGroups);
  const row = groups.map(() => 0);
  for (const g of topo)
    for (const c of get(childGroups, g)) row[c] = Math.max(get(row, c), get(row, g) + 1);

  // Pull groups down towards their children when that shortens more lines than it stretches, so
  // married-in grandparents sit right above their child instead of in the top row. Bottom-up, one pass.
  for (const g of [...topo].reverse()) {
    const kids = get(childGroups, g);
    if (!kids.length) continue;
    const members = get(groups, g);
    const downLinks = members.reduce((n, id) => n + get(graph.children, id).length, 0);
    const upLinks = members.reduce((n, id) => n + get(graph.parents, id).length, 0);
    if (downLinks >= upLinks)
      row[g] = Math.max(get(row, g), Math.min(...kids.map((c) => get(row, c))) - 1);
  }

  const top = Math.min(...row);
  return new Map(graph.ids.map((id) => [id, get(row, get(groupOf, id)) - top]));
}

/**
 * Persons that share a row, as lists of IDs in data order: partners first, then siblings. A pair that would
 * put someone in the same row as their own ancestor (a loop) is left out: partners then get a diagonal line,
 * siblings different rows. Partners go first because a straight couple line matters more.
 */
function sameRowGroups(graph: FamilyGraph): PersonId[][] {
  const rep = new Map(graph.ids.map((id) => [id, id]));
  const find = (id: PersonId): PersonId => {
    let r = id;
    while (get(rep, r) !== r) r = get(rep, r);
    return r;
  };
  // Can group `to` be reached from group `from` by going down to children (and across to their partners)?
  const reaches = (from: PersonId, to: PersonId): boolean => {
    const seen = new Set([from]);
    const todo = [from];
    for (let g = todo.pop(); g !== undefined; g = todo.pop())
      for (const id of graph.ids.filter((m) => find(m) === g))
        for (const c of get(graph.children, id)) {
          const cg = find(c);
          if (cg === to) return true;
          if (!seen.has(cg)) {
            seen.add(cg);
            todo.push(cg);
          }
        }
    return false;
  };
  const join = (x: PersonId, y: PersonId) => {
    const a = find(x);
    const b = find(y);
    if (a !== b && !reaches(a, b) && !reaches(b, a)) rep.set(b, a);
  };
  for (const id of graph.ids) for (const partner of get(graph.partners, id)) join(id, partner);
  for (const id of graph.ids) {
    const [first, ...rest] = get(graph.children, id);
    if (first !== undefined) for (const kid of rest) join(first, kid);
  }
  const groups = new Map<PersonId, PersonId[]>();
  for (const id of graph.ids) {
    const r = find(id);
    groups.set(r, [...(groups.get(r) ?? []), id]);
  }
  return [...groups.values()];
}

/** Kahn's algorithm: parents before children. The groups form no loops (see partnerGroups). */
function topologicalOrder(childGroups: number[][]): number[] {
  const incoming = childGroups.map(() => 0);
  for (const kids of childGroups) for (const c of kids) incoming[c] = get(incoming, c) + 1;
  const ready = incoming.flatMap((n, g) => (n === 0 ? [g] : []));
  const order: number[] = [];
  for (let g = ready.shift(); g !== undefined; g = ready.shift()) {
    order.push(g);
    for (const c of get(childGroups, g)) {
      incoming[c] = get(incoming, c) - 1;
      if (incoming[c] === 0) ready.push(c);
    }
  }
  return order;
}
