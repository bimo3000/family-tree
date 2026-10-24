/**
 * The "Familie" section of the detail panel (ui-concept §2.4): Eltern, Partner/in, Kinder, Geschwister,
 * each entry with its German role word and years. Empty groups are left out.
 */
import { dateSortKey } from '../../core/dates';
import {
  childLinksOf,
  findPerson,
  isPlaceholder,
  parentLinksOf,
  partnerOf,
  partnershipsOf,
  siblingsOf,
} from '../../core/model/queries';
import type { Person, PersonId, Project } from '../../core/model/types';
import {
  childWord,
  parentWord,
  partnershipDetail,
  partnerWord,
  shortName,
  siblingWord,
  yearsLine,
} from '../text';

export interface FamilyEntry {
  id: PersonId;
  name: string;
  /** An unknown parent: the name is shown as "unbekannt". */
  unknown: boolean;
  /** Role word and years, shown separated by a spaced pipe. */
  info: string[];
  /** Wedding and divorce details of a partner. */
  detail: string;
}

export interface FamilyGroup {
  title: string;
  entries: FamilyEntry[];
}

export function familyGroups(project: Project, personId: PersonId): FamilyGroup[] {
  const person = (id: PersonId): Person => findPerson(project, id) ?? { id };
  const entry = (q: Person, role: string, detail = ''): FamilyEntry => {
    const unknown = isPlaceholder(q);
    return {
      id: q.id,
      name: unknown ? 'unbekannt' : shortName(q),
      unknown,
      info: unknown ? [] : [role, yearsLine(q)].filter(Boolean),
      detail,
    };
  };

  const parents = parentLinksOf(project, personId).map((l) => {
    const q = person(l.parentId);
    return entry(q, parentWord(q, l.kind));
  });
  const partners = partnershipsOf(project, personId).map((r) => {
    const q = person(partnerOf(r, personId));
    return entry(q, partnerWord(q, r), partnershipDetail(r));
  });
  const children = childLinksOf(project, personId)
    .map((l) => ({ q: person(l.childId), kind: l.kind }))
    .sort((a, b) => birthKey(a.q) - birthKey(b.q))
    .map(({ q, kind }) => entry(q, childWord(q, kind)));
  const siblings = siblingsOf(project, personId).map((s) => {
    const q = person(s.id);
    return entry(q, siblingWord(q, s.full));
  });

  return [
    { title: 'Eltern', entries: parents },
    { title: partners.length > 1 ? 'Partner/innen' : 'Partner/in', entries: partners },
    { title: 'Kinder', entries: children },
    { title: 'Geschwister', entries: siblings },
  ].filter((g) => g.entries.length > 0);
}

/** Undated persons go last; the sort is stable, so they keep their order. */
function birthKey(p: Person): number {
  return dateSortKey(p.birth?.date) ?? Infinity;
}
