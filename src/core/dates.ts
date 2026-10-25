/**
 * Flexible dates (PERS-06, data-model §4): reading what the user typed and sorting.
 * Input is understood in German, English and French at once, whatever the UI language (GEN-05),
 * always with the day before the month. Display strings live in src/ui/i18n/.
 */
import type { FlexDate } from './model/types';

/** Month names without accents. A typed name may be shortened to 3 letters or more: "Mär.", "Sept", "juil". */
const MONTH_NAMES: string[][] = [
  ['januar', 'january', 'janvier'],
  ['februar', 'february', 'fevrier'],
  ['maerz', 'marz', 'march', 'mars'],
  ['april', 'avril'],
  ['mai', 'may'],
  ['juni', 'june', 'juin'],
  ['juli', 'july', 'juillet'],
  ['august', 'aout'],
  ['september', 'septembre'],
  ['oktober', 'october', 'octobre'],
  ['november', 'novembre'],
  ['dezember', 'december', 'decembre'],
];

const Y = String.raw`(\d{3,4})`;
const ABOUT = new RegExp(
  String.raw`^(?:ca\.?|circa|um|~|about|abt\.?|c\.|vers|env\.?|environ|v\.)\s*${Y}$`,
  'i',
);
const BEFORE = new RegExp(String.raw`^(?:vor|before|bef\.?|avant|av\.)\s*${Y}$`, 'i');
const AFTER = new RegExp(String.raw`^(?:nach|after|aft\.?|après|apres|ap\.)\s*${Y}$`, 'i');
const BETWEEN = new RegExp(
  String.raw`^(?:zw\.?|zwischen|between|bet\.?|entre)\s*${Y}\s*(?:und|and|et|-|–)\s*${Y}$`,
  'i',
);
const RANGE = new RegExp(String.raw`^${Y}\s*(?:[-–]|\s+(?:bis|to|à|a)\s+)\s*${Y}$`, 'i');
/** "März 1923", "12. März 1923", "12 March 1923", "1er mars 1923". */
const NAMED = new RegExp(String.raw`^(?:(\d{1,2})(?:\.|er)?\s*)?(\p{L}{3,})\.?\s+${Y}$`, 'iu');

/**
 * Reads a date input. Returns `undefined` for empty input. Input it can't read is kept
 * as `{ text }` and never rejected.
 */
export function parseDate(input: string): FlexDate | undefined {
  const s = input.trim();
  if (!s) return undefined;
  let m: RegExpMatchArray | null;

  if ((m = s.match(/^(\d{1,2})[./]\s*(\d{1,2})[./]\s*(\d{3,4})$/)))
    return exact(+m[3]!, +m[2]!, +m[1]!) ?? { text: s };
  if ((m = s.match(/^(\d{1,2})[./](\d{3,4})$/))) return exact(+m[2]!, +m[1]!) ?? { text: s };
  if ((m = s.match(/^(\d{3,4})$/))) return { y: +m[1]! };
  if ((m = s.match(ABOUT))) return { y: +m[1]!, q: 'about' };
  if ((m = s.match(BEFORE))) return { y: +m[1]!, q: 'before' };
  if ((m = s.match(AFTER))) return { y: +m[1]!, q: 'after' };
  if ((m = s.match(BETWEEN)) || (m = s.match(RANGE))) {
    const [from, to] = [+m[1]!, +m[2]!];
    if (from < to) return { y: from, q: 'between', y2: to };
    return { text: s };
  }
  if ((m = s.match(NAMED))) {
    const month = monthOf(m[2]!);
    if (month) return exact(+m[3]!, month, m[1] ? +m[1] : undefined) ?? { text: s };
  }
  return { text: s };
}

/** The month a typed name stands for, or `undefined` if it fits none or several ("jui": juin or juillet). */
function monthOf(typed: string): number | undefined {
  const t = typed.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  const months = MONTH_NAMES.flatMap((names, i) =>
    names.some((n) => n.startsWith(t)) ? [i + 1] : [],
  );
  return months.length === 1 ? months[0] : undefined;
}

/**
 * A number for sorting (1923-03-12 → 19230312, 1923 → 19230000), or `undefined` for text dates.
 * Qualified dates sort by their year ("vor 1900" sorts as 1900, "1890 bis 1895" as 1890).
 */
export function dateSortKey(date: FlexDate | undefined): number | undefined {
  if (!date || 'text' in date) return undefined;
  if ('q' in date) return date.y * 10000;
  return date.y * 10000 + (date.m ?? 0) * 100 + (date.d ?? 0);
}

/** A valid calendar date, or `undefined` (e.g. 31.02.1923 or month 13). */
function exact(y: number, m: number, d?: number): FlexDate | undefined {
  if (m < 1 || m > 12) return undefined;
  if (d === undefined) return { y, m };
  // Day 0 of the next month is the last day of this month.
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d >= 1 && d <= daysInMonth ? { y, m, d } : undefined;
}
