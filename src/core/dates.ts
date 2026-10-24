/**
 * Flexible dates (PERS-06, data-model §4): reading what the user typed and sorting.
 * Display strings ("ca. 1850", "→ ungefähr 1850") are German text and live in src/ui/.
 */
import type { FlexDate } from './model/types';

/** Month names the parser understands, e.g. "März 1923", "Mär. 1923", "Maerz 1923". */
const MONTH_NAMES = [
  'januar',
  'februar',
  'märz',
  'april',
  'mai',
  'juni',
  'juli',
  'august',
  'september',
  'oktober',
  'november',
  'dezember',
];

/**
 * Reads a German date input. Returns `undefined` for empty input. Input it can't read is kept
 * as `{ text }` and never rejected.
 */
export function parseDate(input: string): FlexDate | undefined {
  const s = input.trim();
  if (!s) return undefined;
  let m: RegExpMatchArray | null;

  if ((m = s.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{3,4})$/)))
    return exact(+m[3]!, +m[2]!, +m[1]!) ?? { text: s };
  if ((m = s.match(/^(\d{1,2})\.(\d{3,4})$/))) return exact(+m[2]!, +m[1]!) ?? { text: s };
  if ((m = s.match(/^([a-zäA-ZÄ]{3,})\.?\s+(\d{3,4})$/))) {
    const typed = umlautsToAscii(m[1]!.toLowerCase());
    const month = MONTH_NAMES.findIndex((name) => umlautsToAscii(name).startsWith(typed));
    if (month >= 0) return { y: +m[2]!, m: month + 1 };
  }
  if ((m = s.match(/^(\d{3,4})$/))) return { y: +m[1]! };
  if ((m = s.match(/^(?:ca\.?|um|~)\s*(\d{3,4})$/i))) return { y: +m[1]!, q: 'about' };
  if ((m = s.match(/^vor\s+(\d{3,4})$/i))) return { y: +m[1]!, q: 'before' };
  if ((m = s.match(/^nach\s+(\d{3,4})$/i))) return { y: +m[1]!, q: 'after' };
  if (
    (m = s.match(/^(?:zw\.?|zwischen)\s*(\d{3,4})\s*(?:und|-|–)\s*(\d{3,4})$/i)) ||
    (m = s.match(/^(\d{3,4})\s*[-–]\s*(\d{3,4})$/))
  ) {
    const [from, to] = [+m[1]!, +m[2]!];
    if (from < to) return { y: from, q: 'between', y2: to };
  }
  return { text: s };
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

function umlautsToAscii(s: string): string {
  return s.replace('ä', 'ae');
}
