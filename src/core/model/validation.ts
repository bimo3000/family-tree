/**
 * The rules every project must follow (data-model §3). Operations check them before changing
 * anything; validateProject checks a whole project, e.g. one read from a file.
 * Errors carry a code, not a text: the UI turns codes into German messages.
 */
import { descendantsOf, findPerson, isBiological, parentLinksOf } from './queries';
import type { ParentChildKind, PersonId, Project } from './types';

export type ModelErrorCode =
  | 'unknown-person'
  | 'unknown-relation'
  | 'duplicate-id'
  | 'self-partnership'
  | 'duplicate-partnership'
  | 'duplicate-link'
  /** A person would become their own ancestor (also: being one's own parent). */
  | 'loop'
  | 'too-many-biological-parents'
  /** Reading a file: not a Stammbaum project at all. */
  | 'not-a-project'
  /** Reading a file: written by a newer app version. */
  | 'newer-version'
  /** Reading a file: damaged or breaks the rules above. */
  | 'invalid';

export class ModelError extends Error {
  readonly code: ModelErrorCode;

  constructor(code: ModelErrorCode) {
    super(code);
    this.name = 'ModelError';
    this.code = code;
  }
}

export function checkPersonExists(project: Project, id: PersonId): void {
  if (!findPerson(project, id)) throw new ModelError('unknown-person');
}

/** May `a` and `b` become partners? */
export function checkPartnership(project: Project, a: PersonId, b: PersonId): void {
  checkPersonExists(project, a);
  checkPersonExists(project, b);
  if (a === b) throw new ModelError('self-partnership');
  if (project.partnerships.some((r) => r.partners.includes(a) && r.partners.includes(b)))
    throw new ModelError('duplicate-partnership');
}

/** May `parentId` become a parent of `childId` with this kind of link? */
export function checkParentChild(
  project: Project,
  parentId: PersonId,
  childId: PersonId,
  kind: ParentChildKind | undefined,
): void {
  checkPersonExists(project, parentId);
  checkPersonExists(project, childId);
  if (project.parentChild.some((l) => l.parentId === parentId && l.childId === childId))
    throw new ModelError('duplicate-link');
  if (parentId === childId || descendantsOf(project, childId).has(parentId))
    throw new ModelError('loop');
  if (!kind || kind === 'biological') checkBiologicalParentSlot(project, childId);
}

/** At most two biological parents per person. Further parents are adoptive, step or foster. */
export function checkBiologicalParentSlot(
  project: Project,
  childId: PersonId,
  ignoreParentId?: PersonId,
): void {
  const biological = parentLinksOf(project, childId).filter(
    (l) => isBiological(l) && l.parentId !== ignoreParentId,
  );
  if (biological.length >= 2) throw new ModelError('too-many-biological-parents');
}

/** Checks a whole project by adding its relations one by one, as the operations would. */
export function validateProject(project: Project): void {
  const ids = new Set<string>();
  for (const { id } of [...project.persons, ...project.partnerships]) {
    if (ids.has(id)) throw new ModelError('duplicate-id');
    ids.add(id);
  }
  // A private copy that grows relation by relation.
  const partial: Project = { ...project, partnerships: [], parentChild: [] };
  for (const r of project.partnerships) {
    checkPartnership(partial, ...r.partners);
    partial.partnerships.push(r);
  }
  for (const l of project.parentChild) {
    checkParentChild(partial, l.parentId, l.childId, l.kind);
    partial.parentChild.push(l);
  }
}
