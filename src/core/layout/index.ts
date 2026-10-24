/**
 * The automatic tree layout (ADR-0006): a project goes in, card positions and lines come out. Pure and
 * deterministic, so the same data always looks the same; the UI recomputes it fully after every change.
 * Parts of the tree without any relation to each other are laid out one by one and placed side by side.
 */
import { assignRows } from './generations';
import { buildGraph, get } from './graph';
import { drawLines } from './lines';
import { placeRows } from './coordinates';
import { orderRows } from './order';
import { DEFAULT_SIZES, type CardBox, type Layout, type LayoutSizes } from './types';
import { connectedComponent, isPlaceholder } from '../model/queries';
import type { PersonId, Project } from '../model/types';

export * from './types';

export function computeLayout(project: Project, sizes: LayoutSizes = DEFAULT_SIZES): Layout {
  const unknown = new Set(project.persons.filter(isPlaceholder).map((p) => p.id));
  const width = (id: PersonId) => (unknown.has(id) ? sizes.unknownSize : sizes.cardWidth);
  const partnerGap = new Map(
    project.partnerships.map((r) => [
      pairKey(...r.partners),
      r.end?.reason ? sizes.endedGap : sizes.gap,
    ]),
  );

  const cards = new Map<PersonId, CardBox>();
  let left = 0;
  for (const person of project.persons) {
    if (cards.has(person.id)) continue;
    const graph = buildGraph(project, [...connectedComponent(project, person.id)]);
    // Siblings and parents of the same child (e.g. a mother and a "?") stand as close as partners.
    const shared = (rel: Map<PersonId, PersonId[]>, a: PersonId, b: PersonId) =>
      get(rel, a).some((p) => get(rel, b).includes(p));
    const gap = (a: PersonId, b: PersonId) =>
      partnerGap.get(pairKey(a, b)) ??
      (shared(graph.parents, a, b) || shared(graph.children, a, b) ? sizes.gap : sizes.familyGap);
    const rows = assignRows(graph);
    const x = placeRows(graph, orderRows(graph, rows), width, gap);
    const shift = left - Math.min(...graph.ids.map((id) => get(x, id) - width(id) / 2));
    for (const id of graph.ids) {
      const placeholder = unknown.has(id);
      cards.set(id, {
        id,
        x: get(x, id) + shift,
        y: get(rows, id) * sizes.rowHeight + sizes.cardHeight / 2,
        width: width(id),
        height: placeholder ? sizes.unknownSize : sizes.cardHeight,
        placeholder,
      });
    }
    left = Math.max(...graph.ids.map((id) => get(x, id) + shift + width(id) / 2)) + sizes.partGap;
  }

  const list = project.persons.map((p) => get(cards, p.id));
  return {
    cards: list,
    ...drawLines(project, cards, sizes),
    width: Math.max(0, ...list.map((c) => c.x + c.width / 2)),
    height: Math.max(0, ...list.map((c) => c.y + sizes.cardHeight / 2)),
  };
}

function pairKey(a: PersonId, b: PersonId): string {
  return a < b ? `${a} ${b}` : `${b} ${a}`;
}
