/**
 * Read-only questions about a project: who are the parents, partners, siblings, ancestors of a person.
 * Relations are stored as links (ADR-0007); everything here is derived from them.
 */
import { dateSortKey } from '../dates';
import type { ParentChildLink, Partnership, Person, PersonId, Project } from './types';

/** A stored relation: a partnership or a parent-child link. */
export type Relation = Partnership | ParentChildLink;

export interface Sibling {
  id: PersonId;
  /** Same parents (full sibling) or only some in common (half sibling). */
  full: boolean;
}

export function findPerson(project: Project, id: PersonId): Person | undefined {
  return project.persons.find((p) => p.id === id);
}

/** Absent `kind` means biological. */
export function isBiological(link: ParentChildLink): boolean {
  return !link.kind || link.kind === 'biological';
}

/**
 * An unknown parent ("?" node): a person without any data. It exists only for its children.
 * Filling in any field turns it into a normal person (data-model "Placeholder persons").
 */
export function isPlaceholder(person: Person): boolean {
  return Object.keys(person).every((key) => key === 'id');
}

export function parentLinksOf(project: Project, childId: PersonId): ParentChildLink[] {
  return project.parentChild.filter((l) => l.childId === childId);
}

export function childLinksOf(project: Project, parentId: PersonId): ParentChildLink[] {
  return project.parentChild.filter((l) => l.parentId === parentId);
}

/** The person's partnerships, ordered by start date; undated ones last, in creation order. */
export function partnershipsOf(project: Project, personId: PersonId): Partnership[] {
  return project.partnerships
    .filter((r) => r.partners.includes(personId))
    .sort((a, b) => sortable(dateSortKey(a.start?.date)) - sortable(dateSortKey(b.start?.date)));
}

/** The other person in a partnership. */
export function partnerOf(partnership: Partnership, personId: PersonId): PersonId {
  return partnership.partners[0] === personId ? partnership.partners[1] : partnership.partners[0];
}

/**
 * Everyone sharing at least one biological or adoptive parent with the person, ordered by birth date.
 * A step or foster parent's other children are no siblings (user, 2026-10-25).
 */
export function siblingsOf(project: Project, personId: PersonId): Sibling[] {
  const counts = (l: ParentChildLink) => l.kind !== 'step' && l.kind !== 'foster';
  const siblingParents = (id: PersonId) =>
    parentLinksOf(project, id)
      .filter(counts)
      .map((l) => l.parentId);
  const mine = siblingParents(personId);
  const siblingIds = new Set(
    mine.flatMap((id) =>
      childLinksOf(project, id)
        .filter(counts)
        .map((l) => l.childId),
    ),
  );
  siblingIds.delete(personId);
  return [...siblingIds]
    .map((id) => {
      const theirs = siblingParents(id);
      const full = theirs.length === mine.length && theirs.every((p) => mine.includes(p));
      return { id, full };
    })
    .sort((a, b) => birthKey(project, a.id) - birthKey(project, b.id));
}

/** All parents, grandparents, … (any kind of link), without the person. */
export function ancestorsOf(project: Project, personId: PersonId): Set<PersonId> {
  return reachable(personId, (id) => parentIds(project, id));
}

/** All children, grandchildren, … (any kind of link), without the person. */
export function descendantsOf(project: Project, personId: PersonId): Set<PersonId> {
  return reachable(personId, (id) => childLinksOf(project, id).map((l) => l.childId));
}

/** The highlighted line when a person is selected (TREE-02): ancestors, descendants and partners. */
export function focusSet(project: Project, personId: PersonId): Set<PersonId> {
  return new Set([
    personId,
    ...ancestorsOf(project, personId),
    ...descendantsOf(project, personId),
    ...partnershipsOf(project, personId).map((r) => partnerOf(r, personId)),
  ]);
}

/**
 * Everyone connected to `start` through any relation, optionally pretending `without` is gone.
 * Used for the "cut off" warning before a relation is removed (ui-concept §2.8).
 */
export function connectedComponent(
  project: Project,
  start: PersonId,
  without?: Relation,
): Set<PersonId> {
  const component = reachable(start, (id) => [
    ...project.parentChild
      .filter((l) => (l.parentId === id || l.childId === id) && !sameRelation(l, without))
      .map((l) => (l.parentId === id ? l.childId : l.parentId)),
    ...project.partnerships
      .filter((r) => r.partners.includes(id) && !sameRelation(r, without))
      .map((r) => partnerOf(r, id)),
  ]);
  component.add(start);
  return component;
}

/** Partnerships are identified by ID, parent-child links by their two persons. */
export function sameRelation(a: Relation, b: Relation | undefined): boolean {
  if (!b) return false;
  if ('partners' in a) return 'partners' in b && a.id === b.id;
  return !('partners' in b) && a.parentId === b.parentId && a.childId === b.childId;
}

function parentIds(project: Project, childId: PersonId): PersonId[] {
  return parentLinksOf(project, childId).map((l) => l.parentId);
}

function birthKey(project: Project, id: PersonId): number {
  return sortable(dateSortKey(findPerson(project, id)?.birth?.date));
}

/** Unknown dates sort last. */
function sortable(key: number | undefined): number {
  return key ?? Number.MAX_SAFE_INTEGER;
}

/** Everyone reachable from `start` by repeatedly following `next`, without `start` itself. */
function reachable(start: PersonId, next: (id: PersonId) => PersonId[]): Set<PersonId> {
  const seen = new Set<PersonId>();
  const todo = [start];
  for (let id = todo.pop(); id !== undefined; id = todo.pop())
    for (const n of next(id))
      if (n !== start && !seen.has(n)) {
        seen.add(n);
        todo.push(n);
      }
  return seen;
}
