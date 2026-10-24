/**
 * Every change to a project. Each operation is a pure function: it checks the rules, then returns
 * a new project and never modifies the one it was given. That is what makes undo/redo simple (UI-01).
 * Empty values are dropped, so the stored data stays as simple as the family (TREE-04).
 */
import { newId } from './project';
import { childLinksOf, findPerson, isPlaceholder, parentLinksOf, partnerOf } from './queries';
import {
  ModelError,
  checkBiologicalParentSlot,
  checkParentChild,
  checkPartnership,
  checkPersonExists,
} from './validation';
import type {
  ImageRef,
  ParentChildKind,
  ParentChildLink,
  PartnershipDetails,
  Person,
  PersonId,
  Project,
} from './types';

/** The result of an operation that creates something: the new project and the new ID. */
export interface Added {
  project: Project;
  id: string;
}

// ---------------------------------------------------------------- project

/** A name is needed: an empty one keeps the old name. */
export function renameProject(project: Project, name: string): Project {
  const trimmed = name.trim();
  return trimmed ? { ...project, name: trimmed } : project;
}

// ---------------------------------------------------------------- persons (PERS-01)

export function addPerson(project: Project, fields: Omit<Person, 'id'> = {}): Added {
  const id = newId('p');
  return { project: { ...project, persons: [...project.persons, { ...compact(fields), id }] }, id };
}

/** Replaces the person with the same ID. */
export function updatePerson(project: Project, person: Person): Project {
  checkPersonExists(project, person.id);
  const updated = { ...compact(person), id: person.id };
  return { ...project, persons: project.persons.map((p) => (p.id === person.id ? updated : p)) };
}

/** Removes the person and all their relations. Their children and partners stay. */
export function deletePerson(project: Project, id: PersonId): Project {
  checkPersonExists(project, id);
  return dropEmptyPlaceholders(removePersonAndRelations(project, id), relativesAbove(project, id));
}

// ---------------------------------------------------------------- photos (PERS-03)

/** Gives the person this picture. A previous one is dropped: one photo per person. */
export function setPhoto(project: Project, personId: PersonId, image: ImageRef): Project {
  const removed = removePhoto(project, personId);
  return {
    ...removed,
    persons: removed.persons.map((p) => (p.id === personId ? { ...p, photoId: image.id } : p)),
    images: [...removed.images, image],
  };
}

export function removePhoto(project: Project, personId: PersonId): Project {
  checkPersonExists(project, personId);
  return {
    ...withoutImageOf(project, personId),
    persons: project.persons.map((p) => {
      if (p.id !== personId) return p;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- dropped on purpose
      const { photoId, ...rest } = p;
      return rest;
    }),
  };
}

// ---------------------------------------------------------------- partnerships (TREE-03)

export function addPartnership(
  project: Project,
  a: PersonId,
  b: PersonId,
  details: PartnershipDetails = {},
): Added {
  checkPartnership(project, a, b);
  const id = newId('u');
  const partnership = { ...compact(details), id, partners: [a, b] as [PersonId, PersonId] };
  return { project: { ...project, partnerships: [...project.partnerships, partnership] }, id };
}

/** Replaces kind, start and end. The two partners stay the same. */
export function updatePartnership(
  project: Project,
  id: string,
  details: PartnershipDetails,
): Project {
  const old = project.partnerships.find((r) => r.id === id);
  if (!old) throw new ModelError('unknown-relation');
  const updated = { ...compact(details), id, partners: old.partners };
  return { ...project, partnerships: project.partnerships.map((r) => (r.id === id ? updated : r)) };
}

export function removePartnership(project: Project, id: string): Project {
  const old = project.partnerships.find((r) => r.id === id);
  if (!old) throw new ModelError('unknown-relation');
  const result = { ...project, partnerships: project.partnerships.filter((r) => r !== old) };
  return dropEmptyPlaceholders(result, old.partners);
}

// ---------------------------------------------------------------- parent-child links (TREE-03)

/** Without `kind` the link is biological. */
export function addParentChild(
  project: Project,
  parentId: PersonId,
  childId: PersonId,
  kind?: ParentChildKind,
): Project {
  checkParentChild(project, parentId, childId, kind);
  return { ...project, parentChild: [...project.parentChild, link(parentId, childId, kind)] };
}

export function setParentChildKind(
  project: Project,
  parentId: PersonId,
  childId: PersonId,
  kind: ParentChildKind,
): Project {
  const old = findLink(project, parentId, childId);
  if (kind === 'biological') checkBiologicalParentSlot(project, childId, parentId);
  const updated = link(parentId, childId, kind);
  return { ...project, parentChild: project.parentChild.map((l) => (l === old ? updated : l)) };
}

/** Removes the link. An unknown parent left without children disappears with it. */
export function removeParentChild(
  project: Project,
  parentId: PersonId,
  childId: PersonId,
): Project {
  const old = findLink(project, parentId, childId);
  const result = { ...project, parentChild: project.parentChild.filter((l) => l !== old) };
  return dropEmptyPlaceholders(result, [parentId]);
}

/**
 * Creates an unknown parent ("?" node) for the child, e.g. for "+ Geschwister" when no parent is
 * known yet (clarifications log 2026-10-24). The placeholder is simply a person without any data.
 */
export function addUnknownParent(project: Project, childId: PersonId): Added {
  checkPersonExists(project, childId);
  checkBiologicalParentSlot(project, childId);
  const added = addPerson(project);
  return { project: addParentChild(added.project, added.id, childId), id: added.id };
}

/**
 * Removes those of the given persons that are placeholders without children: an unknown parent only
 * exists for its children. Only the given persons are checked, so a new, still empty person survives.
 */
export function dropEmptyPlaceholders(project: Project, candidates: PersonId[]): Project {
  const drop = candidates.filter((id) => {
    const person = findPerson(project, id);
    return person && isPlaceholder(person) && childLinksOf(project, id).length === 0;
  });
  return drop.reduce(removePersonAndRelations, project);
}

// ---------------------------------------------------------------- helpers

function removePersonAndRelations(project: Project, id: PersonId): Project {
  return {
    ...withoutImageOf(project, id),
    persons: project.persons.filter((p) => p.id !== id),
    partnerships: project.partnerships.filter((r) => !r.partners.includes(id)),
    parentChild: project.parentChild.filter((l) => l.parentId !== id && l.childId !== id),
  };
}

function withoutImageOf(project: Project, personId: PersonId): Project {
  const photoId = findPerson(project, personId)?.photoId;
  return photoId ? { ...project, images: project.images.filter((i) => i.id !== photoId) } : project;
}

/** Parents and partners: the persons that might be left as childless placeholders. */
function relativesAbove(project: Project, id: PersonId): PersonId[] {
  return [
    ...parentLinksOf(project, id).map((l) => l.parentId),
    ...project.partnerships.filter((r) => r.partners.includes(id)).map((r) => partnerOf(r, id)),
  ];
}

function findLink(project: Project, parentId: PersonId, childId: PersonId): ParentChildLink {
  const found = project.parentChild.find((l) => l.parentId === parentId && l.childId === childId);
  if (!found) throw new ModelError('unknown-relation');
  return found;
}

/** Biological is the default, so it is not stored. */
function link(parentId: PersonId, childId: PersonId, kind?: ParentChildKind): ParentChildLink {
  return kind && kind !== 'biological' ? { parentId, childId, kind } : { parentId, childId };
}

/** A copy without empty values: `undefined`, `''`, `false`, `[]` and objects that end up empty. */
function compact<T extends object>(value: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    const kept = isPlainObject(v) ? compact(v) : v;
    if (kept === undefined || kept === '' || kept === false) continue;
    if (Array.isArray(kept) && kept.length === 0) continue;
    if (isPlainObject(kept) && Object.keys(kept).length === 0) continue;
    result[key] = kept;
  }
  return result as T;
}

function isPlainObject(v: unknown): v is object {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
