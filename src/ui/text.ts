/**
 * Display texts for persons, dates and relations (PERS-04/05/06/07), in the current language (GEN-05).
 * The words come from the dictionaries in `i18n/`; this file decides which facts are shown and in what order.
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
import { t } from './i18n/index.svelte';

/** A wider space before "†" on the card keeps the two dates apart (user, 2026-10-25). */
const CARD_GAP = '\u2002';
/** The card's short forms, the same in every language (user, 2026-10-25). */
const CARD = {
  about: (y: number) => `~${y}`,
  before: (y: number) => `<${y}`,
  after: (y: number) => `>${y}`,
  between: (y: number, y2: number) => `${y}/${y2}`,
};

function qualified(d: Exclude<FlexDate, { text: string }>, plain: string, card: boolean): string {
  if (!('q' in d)) return plain;
  const words = card ? CARD : t.dates;
  if (d.q === 'about') return words.about(d.y);
  if (d.q === 'before') return words.before(d.y);
  if (d.q === 'after') return words.after(d.y);
  return 'y2' in d ? words.between(d.y, d.y2) : plain;
}

/** Full precision, for the panel, the tooltip and the date fields: "12.03.1923", "ca. 1850". */
export function fmtDate(d: FlexDate | undefined): string {
  if (!d) return '';
  if ('text' in d) return d.text;
  if ('d' in d && d.d && d.m) return t.dates.day(d.d, d.m, d.y);
  if ('m' in d && d.m) return t.dates.month(d.m, d.y);
  return qualified(d, String(d.y), false);
}

/** The live interpretation under a date field (ui-concept §2.5): "→ 12. März 1923", "→ ungefähr 1850". */
export function dateHint(d: FlexDate | undefined): string {
  if (!d) return '';
  const hint = t.dates.hint;
  if ('text' in d) return hint.text;
  if ('q' in d) {
    if (d.q === 'about') return hint.about(d.y);
    if (d.q === 'before') return hint.before(d.y);
    if (d.q === 'after') return hint.after(d.y);
    return 'y2' in d ? hint.between(d.y, d.y2) : hint.year(d.y);
  }
  if (d.d && d.m) return hint.day(d.d, d.m, d.y);
  if (d.m) return hint.month(d.m, d.y);
  return hint.year(d.y);
}

/** Year only, for lists (PERS-04): "1923", "ca. 1850". */
export function fmtYear(d: FlexDate | undefined): string {
  if (!d) return '';
  if ('text' in d) return d.text;
  return qualified(d, String(d.y), false);
}

/** Year only on the card: "1923", "~1850", "<1900", ">1925", "1890/1895". */
function cardYear(d: FlexDate | undefined): string {
  if (!d) return '';
  if ('text' in d) return d.text;
  return qualified(d, String(d.y), true);
}

/** "12.03.1923 in Lübeck", "in Lübeck", "1923". */
export function eventText(e: LifeEvent | undefined): string {
  if (!e) return '';
  return [fmtDate(e.date), e.place && t.person.atPlace(e.place)].filter(Boolean).join(' ');
}

/** "* 1923 † 2001" in lists. A dead person without a death date gets a bare "†". */
export function yearsLine(p: Person, format = fmtYear, gap = ' '): string {
  const parts: string[] = [];
  if (p.birth?.date) parts.push(`* ${format(p.birth.date)}`);
  if (p.death?.date) parts.push(`† ${format(p.death.date)}`);
  else if (p.deceased) parts.push('†');
  return parts.join(gap);
}

/** The card's date line (PERS-04, D-001): years only, vague years with symbols. */
export const cardLine = (p: Person): string => yearsLine(p, cardYear, CARD_GAP);

/** All given names plus the last known surname. */
export function fullName(p: Person): string {
  if (isPlaceholder(p)) return t.person.unknown;
  return [p.givenNames, p.surname].filter(Boolean).join(' ') || t.person.noName;
}

/** First given name plus surname, for lists: "Karl Brandt". */
export function shortName(p: Person): string {
  if (isPlaceholder(p)) return t.person.unknown;
  const first = p.givenNames?.split(' ')[0];
  return [first, p.surname].filter(Boolean).join(' ') || t.person.noName;
}

/** Shown instead of a photo. */
export function initials(p: Person): string {
  const first = (p.givenNames || '').trim()[0] ?? '';
  const last = (p.surname || '').trim()[0] ?? '';
  return (first + last).toUpperCase() || '?';
}

/** "Mutter", "Adoptivvater", "Elternteil". */
export function parentWord(p: Person, kind?: ParentChildKind): string {
  return t.words.parent(p.gender, kind);
}

/** "Tochter", "Stiefsohn", "Kind". */
export function childWord(p: Person, kind?: ParentChildKind): string {
  return t.words.child(p.gender, kind);
}

/** Label of a dashed child line: "Adoptivkind". */
export function kindLabel(kind: Exclude<ParentChildKind, 'biological'>): string {
  return t.words.kind(kind);
}

/** "Ehefrau" for a marriage, "Partner" otherwise. */
export function partnerWord(p: Person, r: Partnership): string {
  return t.words.partner(p.gender, r.kind === 'marriage');
}

/** "Schwester", "Halbbruder", "Geschwister". */
export function siblingWord(p: Person, full: boolean): string {
  return t.words.sibling(p.gender, full);
}

export function endWord(reason: PartnershipEndReason): string {
  return t.words.end[reason];
}

/** "verheiratet 17.05.1947 in Lübeck, geschieden 1985". Empty if nothing is known. */
export function partnershipDetail(r: Partnership): string {
  const parts: string[] = [];
  const when = eventText(r.start);
  if (when) parts.push(t.words.started(r.kind === 'marriage', when));
  if (r.end?.reason) parts.push(`${endWord(r.end.reason)} ${fmtDate(r.end.date)}`.trim());
  return parts.join(', ');
}

/** Hover tooltip on a card (PERS-04/05): full name, birth name, full dates and places. */
export function tooltipLines(p: Person): { title: string; lines: string[] } {
  if (isPlaceholder(p)) return { title: t.person.unknownParent, lines: [] };
  const lines: string[] = [];
  if (p.birthName) lines.push(t.person.birthName(p.birthName));
  if (p.birth?.date || p.birth?.place) lines.push(`* ${eventText(p.birth)}`);
  if (p.death?.date || p.death?.place) lines.push(`† ${eventText(p.death)}`);
  else if (p.deceased) lines.push(`† ${t.person.dateUnknown}`);
  return { title: fullName(p), lines };
}

/** The filled facts of the detail panel (PERS-05), as label and value. Empty fields are left out. */
export function personFacts(p: Person): [string, string][] {
  const w = t.person;
  const facts: [string, string][] = [];
  if (p.birth?.date || p.birth?.place) facts.push([w.born, eventText(p.birth)]);
  if (p.death?.date || p.death?.place) facts.push([w.died, eventText(p.death)]);
  else if (p.deceased) facts.push([w.died, w.dateUnknown]);
  if (p.occupation) facts.push([w.occupation, p.occupation]);
  if (p.residences) facts.push([w.residences, p.residences]);
  for (const f of p.extraFields ?? []) if (f.label || f.value) facts.push([f.label, f.value]);
  return facts;
}

/** Why a change was not possible, for the codes a user can run into while editing. */
export function errorText(code: ModelErrorCode): string {
  const errors: Record<string, string> = t.errors;
  return errors[code] ?? t.errors.other;
}
