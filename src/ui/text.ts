/**
 * German display texts for persons, dates and relations (GEN-05, PERS-04/05/06/07). Ported from the mock-up.
 * Wording rule (ui-concept §5): no dashes or middle dots as separators, ranges read "1890 bis 1895".
 */
import type { ModelErrorCode } from '../core/model/validation';
import type {
  FlexDate,
  LifeEvent,
  ParentChildKind,
  Partnership,
  PartnershipEndReason,
  Person,
} from '../core/model/types';
import { isPlaceholder } from '../core/model/queries';

const pad = (n: number) => String(n).padStart(2, '0');

function qualified(d: Exclude<FlexDate, { text: string }>, plain: string): string {
  if (!('q' in d)) return plain;
  if (d.q === 'about') return `ca. ${d.y}`;
  if (d.q === 'before') return `vor ${d.y}`;
  if (d.q === 'after') return `nach ${d.y}`;
  return 'y2' in d ? `${d.y} bis ${d.y2}` : plain;
}

/** Full precision, for the panel and the tooltip: "12.03.1923", "03.1923", "ca. 1850", "1890 bis 1895". */
export function fmtDate(d: FlexDate | undefined): string {
  if (!d) return '';
  if ('text' in d) return d.text;
  if ('d' in d && d.d && d.m) return `${pad(d.d)}.${pad(d.m)}.${d.y}`;
  if ('m' in d && d.m) return `${pad(d.m)}.${d.y}`;
  return qualified(d, String(d.y));
}

const MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

/** The live interpretation under a date field (ui-concept §2.5): "→ 12. März 1923", "→ ungefähr 1850". */
export function dateHint(d: FlexDate | undefined): string {
  if (!d) return '';
  if ('text' in d) return '→ wird so übernommen (kann nicht zum Sortieren genutzt werden)';
  if ('q' in d) {
    if (d.q === 'about') return `→ ungefähr ${d.y}`;
    if (d.q === 'before') return `→ vor ${d.y}`;
    if (d.q === 'after') return `→ nach ${d.y}`;
    return 'y2' in d ? `→ zwischen ${d.y} und ${d.y2}` : `→ im Jahr ${d.y}`;
  }
  const month = d.m ? MONTHS[d.m - 1] : undefined;
  if (d.d && month) return `→ ${d.d}. ${month} ${d.y}`;
  if (month) return `→ ${month} ${d.y}`;
  return `→ im Jahr ${d.y}`;
}

/** Year only, for the card (PERS-04). */
export function fmtYear(d: FlexDate | undefined): string {
  if (!d) return '';
  if ('text' in d) return d.text;
  return qualified(d, String(d.y));
}

/** "12.03.1923 in Lübeck", "in Lübeck", "1923". */
export function eventText(e: LifeEvent | undefined): string {
  if (!e) return '';
  return [fmtDate(e.date), e.place && `in ${e.place}`].filter(Boolean).join(' ');
}

/** "* 1923 † 2001" on the card. A dead person without a death date gets a bare "†". */
export function yearsLine(p: Person): string {
  const parts: string[] = [];
  if (p.birth?.date) parts.push(`* ${fmtYear(p.birth.date)}`);
  if (p.death?.date) parts.push(`† ${fmtYear(p.death.date)}`);
  else if (p.deceased) parts.push('†');
  return parts.join(' ');
}

/** All given names plus the last known surname. */
export function fullName(p: Person): string {
  if (isPlaceholder(p)) return 'Unbekannt';
  return [p.givenNames, p.surname].filter(Boolean).join(' ') || 'Ohne Namen';
}

/** First given name plus surname, for lists: "Karl Brandt". */
export function shortName(p: Person): string {
  if (isPlaceholder(p)) return 'Unbekannt';
  const first = p.givenNames?.split(' ')[0];
  return [first, p.surname].filter(Boolean).join(' ') || 'Ohne Namen';
}

/** Shown instead of a photo. */
export function initials(p: Person): string {
  const first = (p.givenNames || '').trim()[0] ?? '';
  const last = (p.surname || '').trim()[0] ?? '';
  return (first + last).toUpperCase() || '?';
}

/** Gendered word if a gender is set, else the neutral one (PERS-07). */
function word(p: Person, female: string, male: string, neutral: string): string {
  return p.gender === 'female' ? female : p.gender === 'male' ? male : neutral;
}

const KIND_PREFIX: Record<Exclude<ParentChildKind, 'biological'>, string> = {
  adoptive: 'Adoptiv',
  step: 'Stief',
  foster: 'Pflege',
};

function withKind(kind: ParentChildKind | undefined, w: string): string {
  return kind && kind !== 'biological' ? KIND_PREFIX[kind] + w.toLowerCase() : w;
}

/** "Ihre", "Seine", "Die" (e.g. "Ihre Verbindungen … werden entfernt"). */
export function possessive(p: Person): string {
  return word(p, 'Ihre', 'Seine', 'Die');
}

/** "Mutter", "Adoptivvater", "Elternteil". */
export function parentWord(p: Person, kind?: ParentChildKind): string {
  return withKind(kind, word(p, 'Mutter', 'Vater', 'Elternteil'));
}

/** "Tochter", "Stiefsohn", "Kind". */
export function childWord(p: Person, kind?: ParentChildKind): string {
  return withKind(kind, word(p, 'Tochter', 'Sohn', 'Kind'));
}

/** Label of a dashed child line: "Adoptivkind". */
export function kindLabel(kind: Exclude<ParentChildKind, 'biological'>): string {
  return withKind(kind, 'Kind');
}

/** "Ehefrau" for a marriage, "Partner" otherwise. */
export function partnerWord(p: Person, r: Partnership): string {
  return r.kind === 'marriage'
    ? word(p, 'Ehefrau', 'Ehemann', 'Ehepartner/in')
    : word(p, 'Partnerin', 'Partner', 'Partner/in');
}

/** "Schwester", "Halbbruder", "Geschwister". */
export function siblingWord(p: Person, full: boolean): string {
  return full
    ? word(p, 'Schwester', 'Bruder', 'Geschwister')
    : 'Halb' + word(p, 'schwester', 'bruder', 'geschwister');
}

export function endWord(reason: PartnershipEndReason): string {
  return reason === 'divorce' ? 'geschieden' : 'getrennt';
}

/** "verheiratet 17.05.1947 in Lübeck, geschieden 1985". Empty if nothing is known. */
export function partnershipDetail(r: Partnership): string {
  const parts: string[] = [];
  const when = eventText(r.start);
  if (when) parts.push(`${r.kind === 'marriage' ? 'verheiratet' : 'zusammen seit'} ${when}`);
  if (r.end?.reason) parts.push(`${endWord(r.end.reason)} ${fmtDate(r.end.date)}`.trim());
  return parts.join(', ');
}

/** Hover tooltip on a card (PERS-04/05): full name, birth name, full dates and places. */
export function tooltipLines(p: Person): { title: string; lines: string[] } {
  if (isPlaceholder(p)) return { title: 'Unbekannter Elternteil', lines: [] };
  const lines: string[] = [];
  if (p.birthName) lines.push(`geb. ${p.birthName}`);
  if (p.birth?.date || p.birth?.place) lines.push(`* ${eventText(p.birth)}`);
  if (p.death?.date || p.death?.place) lines.push(`† ${eventText(p.death)}`);
  else if (p.deceased) lines.push('† Datum unbekannt');
  return { title: fullName(p), lines };
}

/** The filled facts of the detail panel (PERS-05), as label and value. Empty fields are left out. */
export function personFacts(p: Person): [string, string][] {
  const facts: [string, string][] = [];
  if (p.birth?.date || p.birth?.place) facts.push(['Geboren', eventText(p.birth)]);
  if (p.death?.date || p.death?.place) facts.push(['Gestorben', eventText(p.death)]);
  else if (p.deceased) facts.push(['Gestorben', 'Datum unbekannt']);
  if (p.occupation) facts.push(['Beruf', p.occupation]);
  if (p.residences) facts.push(['Wohnorte', p.residences]);
  for (const f of p.extraFields ?? []) if (f.label || f.value) facts.push([f.label, f.value]);
  return facts;
}

/** Why a change was not possible, for the codes a user can run into while editing. */
export function errorText(code: ModelErrorCode): string {
  switch (code) {
    case 'loop':
      return 'Das geht nicht: Eine Person kann nicht ihr eigener Vorfahr sein.';
    case 'too-many-biological-parents':
      return 'Das geht nicht: Eine Person hat höchstens zwei leibliche Eltern.';
    case 'duplicate-link':
      return 'Diese Verbindung gibt es schon.';
    case 'duplicate-partnership':
      return 'Die beiden sind schon ein Paar.';
    case 'self-partnership':
      return 'Eine Person kann nicht ihr eigener Partner sein.';
    default:
      return 'Das hat nicht geklappt.';
  }
}
