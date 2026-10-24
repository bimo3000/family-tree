/**
 * The relations of one part of the tree as lookup tables, built once per layout so the layout steps
 * don't search the project's lists over and over.
 */
import { dateSortKey } from '../dates';
import { partnerOf, partnershipsOf } from '../model/queries';
import type { PersonId, Project } from '../model/types';

export interface FamilyGraph {
  /** Person IDs in data order. */
  ids: PersonId[];
  /** Position in data order, used to break ties so the layout is deterministic. */
  order: Map<PersonId, number>;
  /** Parents of every kind. */
  parents: Map<PersonId, PersonId[]>;
  /** Children of every kind, oldest first. */
  children: Map<PersonId, PersonId[]>;
  /** Partners in the order of the partnerships (by start date). */
  partners: Map<PersonId, PersonId[]>;
  /** Birth date sort key; unknown dates sort last. */
  birth: Map<PersonId, number>;
}

/** The graph of the given persons (all of the project when `ids` is left out). */
export function buildGraph(project: Project, ids?: PersonId[]): FamilyGraph {
  const included = ids ?? project.persons.map((p) => p.id);
  const inside = new Set(included);
  const graph: FamilyGraph = {
    ids: project.persons.map((p) => p.id).filter((id) => inside.has(id)),
    order: new Map(),
    parents: new Map(),
    children: new Map(),
    partners: new Map(),
    birth: new Map(),
  };
  for (const p of project.persons) {
    if (!inside.has(p.id)) continue;
    graph.order.set(p.id, graph.order.size);
    graph.parents.set(p.id, []);
    graph.children.set(p.id, []);
    graph.birth.set(p.id, dateSortKey(p.birth?.date) ?? Number.MAX_SAFE_INTEGER);
    graph.partners.set(
      p.id,
      partnershipsOf(project, p.id)
        .map((r) => partnerOf(r, p.id))
        .filter((id) => inside.has(id)),
    );
  }
  for (const l of project.parentChild) {
    if (!inside.has(l.parentId) || !inside.has(l.childId)) continue;
    graph.parents.get(l.childId)?.push(l.parentId);
    graph.children.get(l.parentId)?.push(l.childId);
  }
  for (const kids of graph.children.values()) kids.sort((a, b) => compareByBirth(graph, a, b));
  return graph;
}

/** Older first; equal or unknown dates keep data order. */
export function compareByBirth(graph: FamilyGraph, a: PersonId, b: PersonId): number {
  return (
    (graph.birth.get(a) ?? 0) - (graph.birth.get(b) ?? 0) ||
    (graph.order.get(a) ?? 0) - (graph.order.get(b) ?? 0)
  );
}

/** Lookup that throws on a missing key; the layout only asks for entries it created. */
export function get<V>(source: readonly V[], key: number): V;
export function get<K, V>(source: Map<K, V>, key: K): V;
export function get(source: Map<unknown, unknown> | readonly unknown[], key: unknown): unknown {
  const value = Array.isArray(source)
    ? (source as readonly unknown[])[key as number]
    : (source as Map<unknown, unknown>).get(key);
  if (value === undefined) throw new Error(`layout: unknown key ${String(key)}`);
  return value;
}
