// Fictional fixture families for the tree layout (ADR-0006). Each one covers a shape the layout must handle.
// Person IDs double as given names; "id:1950" sets the birth year.
import type { ParentChildKind, PartnershipEndReason, Project } from '../../src/core/model/types';
import { familieBrandt } from './familie-brandt';

interface Builder {
  /** Space-separated persons, e.g. "anna:1950 bernd". */
  persons(list: string): void;
  /** Unknown parents ("?" nodes). */
  unknown(list: string): void;
  couple(a: string, b: string, opts?: { year?: number; ended?: PartnershipEndReason }): void;
  /** Children (space-separated) of the given parents. */
  children(parents: string[], kids: string, kind?: ParentChildKind): void;
}

export function family(name: string, build: (f: Builder) => void): Project {
  const project: Project = {
    id: `fixture-${name}`,
    name,
    createdAt: '2026-10-24T10:00:00.000Z',
    modifiedAt: '2026-10-24T10:00:00.000Z',
    persons: [],
    partnerships: [],
    parentChild: [],
    images: [],
  };
  const words = (list: string) => list.split(' ').filter(Boolean);
  build({
    persons(list) {
      for (const word of words(list)) {
        const [id = '', year] = word.split(':');
        project.persons.push(
          year
            ? { id, givenNames: id, birth: { date: { y: Number(year) } } }
            : { id, givenNames: id },
        );
      }
    },
    unknown(list) {
      for (const id of words(list)) project.persons.push({ id });
    },
    couple(a, b, opts = {}) {
      project.partnerships.push({
        id: `u_${project.partnerships.length + 1}`,
        partners: [a, b],
        ...(opts.year ? { start: { date: { y: opts.year } } } : {}),
        ...(opts.ended ? { end: { reason: opts.ended } } : {}),
      });
    },
    children(parents, kids, kind) {
      for (const childId of words(kids))
        for (const parentId of parents)
          project.parentChild.push(kind ? { parentId, childId, kind } : { parentId, childId });
    },
  });
  return project;
}

export const simple = family('simple', (f) => {
  f.persons('anna:1950 bernd:1948 clara:1975 david:1977 emil:1980');
  f.couple('anna', 'bernd');
  f.children(['anna', 'bernd'], 'clara david emil');
});

/** One person with three partners in a row, children with each. */
export const threePartners = family('three-partners', (f) => {
  f.persons('alex:1940 bea:1942 cora:1945 dora:1950 kid1:1962 kid2:1972 kid3:1982 kid4:1984');
  f.couple('alex', 'bea', { year: 1960, ended: 'divorce' });
  f.couple('alex', 'cora', { year: 1970, ended: 'separation' });
  f.couple('alex', 'dora', { year: 1980 });
  f.children(['alex', 'bea'], 'kid1');
  f.children(['alex', 'cora'], 'kid2');
  f.children(['alex', 'dora'], 'kid3 kid4');
});

/** A child with its biological parents (divorced) and a stepfather next to them. */
export const stepFather = family('step-father', (f) => {
  f.persons('mother:1960 father:1958 step:1955 kid:1985 half:1995');
  f.couple('mother', 'father', { year: 1983, ended: 'divorce' });
  f.couple('mother', 'step', { year: 1990 });
  f.children(['mother', 'father'], 'kid');
  f.children(['step'], 'kid', 'step');
  f.children(['mother', 'step'], 'half');
});

/** A single mother with an unknown father ("?"), and a single father without any partner. */
export const singleParents = family('single-parents', (f) => {
  f.persons('mother:1950 son:1975 daughter:1978 father:1952 boy:1980');
  f.unknown('unknown');
  f.children(['mother', 'unknown'], 'son daughter');
  f.children(['father'], 'boy');
});

/** Cousins marry: their grandparents are the same couple. */
export const cousinMarriage = family('cousin-marriage', (f) => {
  f.persons(
    'gpa:1900 gma:1902 aunt:1925 inlawA:1924 uncle:1927 inlawB:1928 c1:1950 c2:1952 kid:1975',
  );
  f.couple('gpa', 'gma');
  f.children(['gpa', 'gma'], 'aunt uncle');
  f.couple('aunt', 'inlawA');
  f.couple('uncle', 'inlawB');
  f.children(['aunt', 'inlawA'], 'c1');
  f.children(['uncle', 'inlawB'], 'c2');
  f.couple('c1', 'c2');
  f.children(['c1', 'c2'], 'kid');
});

/** An uncle marries his niece: partners from different generations. */
export const uncleNiece = family('uncle-niece', (f) => {
  f.persons('gpa:1900 gma:1902 sister:1925 inlaw:1924 uncle:1935 niece:1950 kid:1975');
  f.couple('gpa', 'gma');
  f.children(['gpa', 'gma'], 'sister uncle');
  f.couple('sister', 'inlaw');
  f.children(['sister', 'inlaw'], 'niece');
  f.couple('uncle', 'niece');
  f.children(['uncle', 'niece'], 'kid');
});

/** Data that can't be drawn in rows: a partnership between a parent and their child. Must not crash. */
export const partnerIsAncestor = family('partner-is-ancestor', (f) => {
  f.persons('parent:1950 child:1975 grandchild:2000');
  f.children(['parent'], 'child');
  f.children(['child'], 'grandchild');
  f.couple('parent', 'child');
});

/** A person marries into the fourth generation and brings only two generations of ancestors. */
export const marriedIn = family('married-in', (f) => {
  f.persons(
    'a1:1875 a2:1877 b1:1900 b2:1902 c1:1925 c2:1927 d1:1950 x:1952 xp1:1925 xp2:1926 xg:1900',
  );
  f.couple('a1', 'a2');
  f.children(['a1', 'a2'], 'b1');
  f.couple('b1', 'b2');
  f.children(['b1', 'b2'], 'c1');
  f.couple('c1', 'c2');
  f.children(['c1', 'c2'], 'd1');
  f.couple('d1', 'x');
  f.couple('xp1', 'xp2');
  f.children(['xp1', 'xp2'], 'x');
  f.children(['xg'], 'xp1');
});

/** Two unrelated families and a person without any relation. */
export const disconnected = family('disconnected', (f) => {
  f.persons('a1:1950 a2:1951 ak:1980 loner:1960 b1:1930 b2:1931 bk1:1960 bk2:1962');
  f.couple('a1', 'a2');
  f.children(['a1', 'a2'], 'ak');
  f.couple('b1', 'b2');
  f.children(['b1', 'b2'], 'bk1 bk2');
});

/**
 * A deterministic family of `size` persons (TREE-05): couples with 1–4 children over several generations,
 * most children marry a partner from outside, some of whom bring their own parents.
 */
export function generatedFamily(size: number): Project {
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return family(`generated-${size}`, (f) => {
    let next = 0;
    const person = (year: number) => {
      const id = `g${next++}`;
      f.persons(`${id}:${year}`);
      return id;
    };
    const couples: [string, string, number][] = [];
    const a = person(1850);
    const b = person(1852);
    f.couple(a, b);
    couples.push([a, b, 1850]);
    while (next < size && couples.length) {
      const [p1, p2, year] = couples.shift() ?? ['', '', 0];
      const kids = 1 + Math.floor(random() * 4);
      for (let i = 0; i < kids && next < size; i++) {
        const kid = person(year + 25 + i * 2);
        f.children([p1, p2], kid);
        if (next >= size || random() < 0.2) continue;
        const partner = person(year + 26 + i * 2);
        f.couple(kid, partner);
        couples.push([kid, partner, year + 25 + i * 2]);
        if (next + 2 <= size && random() < 0.3) {
          const inlaw1 = person(year);
          const inlaw2 = person(year + 2);
          f.couple(inlaw1, inlaw2);
          f.children([inlaw1, inlaw2], partner);
        }
      }
    }
  });
}

export const brandt = familieBrandt;

/** Every fixture family, for the invariant tests. */
export const allFamilies: Project[] = [
  simple,
  brandt,
  threePartners,
  stepFather,
  singleParents,
  cousinMarriage,
  uncleNiece,
  partnerIsAncestor,
  marriedIn,
  disconnected,
  generatedFamily(100),
];
