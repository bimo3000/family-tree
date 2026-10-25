/**
 * Step 1b of the layout: a child who sits more than one row below their parents (e.g. married into a family with
 * one generation more) gets a stand-in in every row their line passes. Stand-ins are ordered and spaced like very
 * narrow cards, so the long line counts when crossings are reduced, and it passes each row in a gap of its own.
 */
import { get, type FamilyGraph } from './graph';
import type { LineGroup } from './lines';
import type { PersonId } from '../model/types';

/** Stand-in IDs start with this; person IDs never do. */
const STAND_IN = '~';

export function isStandIn(id: PersonId): boolean {
  return id.startsWith(STAND_IN);
}

/**
 * The graph and rows with stand-ins added, and per long line (key `group>child`, as in lines.ts) its stand-ins
 * from top to bottom. Each stand-in's parents are the line's parents (the first) or the stand-in above, and the
 * child hangs from the last one instead of from those parents.
 */
export function addPassages(
  graph: FamilyGraph,
  rowOf: Map<PersonId, number>,
  groups: Map<string, LineGroup>,
): { graph: FamilyGraph; rowOf: Map<PersonId, number>; passages: Map<string, PersonId[]> } {
  const copy = (m: Map<PersonId, PersonId[]>) => new Map([...m].map(([k, v]) => [k, [...v]]));
  const out: FamilyGraph = {
    ...graph,
    ids: [...graph.ids],
    order: new Map(graph.order),
    parents: copy(graph.parents),
    children: copy(graph.children),
    partners: new Map(graph.partners),
    birth: new Map(graph.birth),
  };
  const rows = new Map(rowOf);
  const passages = new Map<string, PersonId[]>();
  for (const [key, { parentIds, kids }] of groups)
    for (const kid of kids) {
      if (!graph.order.has(kid)) continue; // another part of the tree
      const lowest = Math.max(...parentIds.map((p) => get(rowOf, p)));
      const chain: PersonId[] = [];
      for (let row = lowest + 1; row < get(rowOf, kid); row++) {
        const id = `${STAND_IN}${key}>${kid}@${row}`;
        const above = chain.length ? [get(chain, chain.length - 1)] : parentIds;
        out.ids.push(id);
        out.order.set(id, out.order.size);
        out.parents.set(id, above);
        out.children.set(id, []);
        out.partners.set(id, []);
        out.birth.set(id, get(graph.birth, kid));
        rows.set(id, row);
        for (const p of above) {
          const children = get(out.children, p);
          const i = children.indexOf(kid);
          if (i >= 0) children[i] = id;
          else children.push(id);
        }
        chain.push(id);
      }
      const last = chain.at(-1);
      if (last === undefined) continue;
      out.parents.set(kid, [...get(out.parents, kid).filter((p) => !parentIds.includes(p)), last]);
      get(out.children, last).push(kid);
      passages.set(`${key}>${kid}`, chain);
    }
  return { graph: out, rowOf: rows, passages };
}
