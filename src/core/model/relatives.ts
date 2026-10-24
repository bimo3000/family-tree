/**
 * The "add a relative" flows of the detail panel (ui-concept §2.6) and the relation removal with its
 * "cut off" check (§2.8). Each flow combines the basic operations, so the same rules apply. The
 * relative is either a new, empty person or an existing one (`existingId`, "Vorhandene Person auswählen").
 */
import {
  type Added,
  addParentChild,
  addPartnership,
  addPerson,
  addUnknownParent,
  removeParentChild,
  removePartnership,
} from './operations';
import {
  type Relation,
  connectedComponent,
  findPerson,
  isBiological,
  isPlaceholder,
  parentLinksOf,
} from './queries';
import { ModelError, checkPersonExists } from './validation';
import type { ParentChildKind, PersonId, Project } from './types';

export interface RelativeOptions {
  /** Link this person instead of creating a new one. */
  existingId?: PersonId;
  /** The kind of the new parent-child link(s); without it they are biological. */
  kind?: ParentChildKind;
}

/** A child of all the given parents (the person and, if chosen, their partner). */
export function addChild(
  project: Project,
  parentIds: PersonId[],
  opts: RelativeOptions = {},
): Added {
  for (const id of parentIds) checkPersonExists(project, id);
  const child = relative(project, opts.existingId);
  const links = parentIds.map((id) => ({ parentId: id, kind: opts.kind }));
  return { project: linkChild(child.project, child.id, links), id: child.id };
}

export function addPartner(
  project: Project,
  personId: PersonId,
  opts: Pick<RelativeOptions, 'existingId'> = {},
): Added {
  checkPersonExists(project, personId);
  const partner = relative(project, opts.existingId);
  return { project: addPartnership(partner.project, personId, partner.id).project, id: partner.id };
}

/**
 * A parent of the person. With `partnerOf` (the one known parent, "ist Partner/in von …") the new
 * parent also becomes their partner, unless the two are partners already.
 */
export function addParent(
  project: Project,
  childId: PersonId,
  opts: RelativeOptions & { partnerOf?: PersonId } = {},
): Added {
  checkPersonExists(project, childId);
  const parent = relative(project, opts.existingId);
  let result = addParentChild(parent.project, parent.id, childId, opts.kind);
  const other = opts.partnerOf;
  if (
    other &&
    !result.partnerships.some((r) => r.partners.includes(other) && r.partners.includes(parent.id))
  )
    result = addPartnership(result, other, parent.id).project;
  return { project: result, id: parent.id };
}

/**
 * A child of the same parents, with the same kind of link as the person (or `kind`). Without known
 * parents, an unknown parent ("?") is created first so the two belong together (clarification 2026-10-24).
 */
export function addSibling(
  project: Project,
  personId: PersonId,
  opts: RelativeOptions = {},
): Added {
  checkPersonExists(project, personId);
  let result = project;
  if (parentLinksOf(result, personId).length === 0)
    result = addUnknownParent(result, personId).project;
  const sibling = relative(result, opts.existingId);
  const links = parentLinksOf(result, personId).map((l) => ({
    parentId: l.parentId,
    kind: opts.kind ?? l.kind,
  }));
  return { project: linkChild(sibling.project, sibling.id, links), id: sibling.id };
}

/**
 * Would linking the child to these parents give them more than two biological parents? Then the
 * UI asks "Was für ein Kind ist … für …?" (adoptive, step, foster).
 */
export function childKindNeeded(
  project: Project,
  childId: PersonId,
  parentIds: PersonId[],
): boolean {
  const biological = parentLinksOf(project, childId)
    .filter(isBiological)
    .map((l) => l.parentId);
  return new Set([...biological, ...parentIds]).size > 2;
}

/**
 * The persons that lose every connection to the rest of the tree when the relation goes: the
 * smaller of the two parts it would leave behind, without unknown parents. Empty if nothing is cut off.
 */
export function cutOffBy(project: Project, relation: Relation): PersonId[] {
  const [a, b] = ends(relation);
  const sideA = connectedComponent(project, a, relation);
  if (sideA.has(b)) return [];
  const sideB = connectedComponent(project, b, relation);
  const smaller = sideA.size <= sideB.size ? sideA : sideB;
  return [...smaller].filter((id) => {
    const person = findPerson(project, id);
    return person && !isPlaceholder(person);
  });
}

/** Removes a partnership or a parent-child link. The persons stay; an unknown parent without children goes. */
export function removeRelation(project: Project, relation: Relation): Project {
  return 'partners' in relation
    ? removePartnership(project, relation.id)
    : removeParentChild(project, relation.parentId, relation.childId);
}

/** The two persons a relation joins. */
export function ends(relation: Relation): [PersonId, PersonId] {
  return 'partners' in relation ? relation.partners : [relation.parentId, relation.childId];
}

// ---------------------------------------------------------------- helpers

function relative(project: Project, existingId: PersonId | undefined): Added {
  if (existingId === undefined) return addPerson(project);
  checkPersonExists(project, existingId);
  return { project, id: existingId };
}

/** Links the child to each parent it is not linked to yet. Linking nothing new is an error. */
function linkChild(
  project: Project,
  childId: PersonId,
  links: { parentId: PersonId; kind: ParentChildKind | undefined }[],
): Project {
  const missing = links.filter(
    (l) => !parentLinksOf(project, childId).some((m) => m.parentId === l.parentId),
  );
  if (missing.length === 0) throw new ModelError('duplicate-link');
  return missing.reduce((p, l) => addParentChild(p, l.parentId, childId, l.kind), project);
}
