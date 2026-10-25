import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseDate } from '../../../src/core/dates';
import type { FlexDate } from '../../../src/core/model/types';
import { LANGUAGES, pickLanguage, setLanguage } from '../../../src/ui/i18n/index.svelte';
import { cardLine, fmtDate } from '../../../src/ui/text';

const UI = join(import.meta.dirname, '../../../src/ui');

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
  );
}

/** Removes `{…}` expressions, counting nested braces. */
function withoutExpressions(markup: string): string {
  let out = '';
  let depth = 0;
  for (const c of markup) {
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (depth === 0) out += c;
  }
  return out;
}

describe('UI texts come from the dictionaries (GEN-05, ADR-0008)', () => {
  const svelte = files(UI).filter((f) => f.endsWith('.svelte'));

  it.each(svelte.map((f) => [relative(UI, f), f]))('%s has no text in its markup', (_, file) => {
    const markup = withoutExpressions(
      readFileSync(file, 'utf8')
        .replace(/<script[\s\S]*?<\/script>/g, '')
        .replace(/<style[\s\S]*?<\/style>/g, '')
        .replace(/<!--[\s\S]*?-->/g, ''),
    );
    const attributes = [
      ...markup.matchAll(/\b(?:title|aria-label|placeholder|label|alt|submit)="([^"]*)"/g),
    ].map((m) => m[1]);
    const text = markup.replace(/<[^>]*>/g, ' ');
    const words = [...attributes, text].join(' ').match(/\p{L}{2,}/gu) ?? [];
    expect(words).toEqual([]);
  });

  it('has no German strings in the UI code outside the dictionaries', () => {
    const code = files(UI).filter((f) => !f.includes(join('ui', 'i18n')));
    const withoutComments = (f: string) =>
      readFileSync(f, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/^\s*\/\/.*$/gm, '');
    const found = code.flatMap((f) =>
      (withoutComments(f).match(/'[^'\n]*[äöüÄÖÜß][^'\n]*'|`[^`]*[äöüÄÖÜß][^`]*`/g) ?? []).map(
        (s) => `${relative(UI, f)}: ${s}`,
      ),
    );
    expect(found).toEqual([]);
  });
});

describe('languages', () => {
  it('picks the first browser language the app knows, else English', () => {
    expect(pickLanguage(['de-AT'])).toBe('de');
    expect(pickLanguage(['fr-CA', 'de'])).toBe('fr');
    expect(pickLanguage(['it-IT', 'fr'])).toBe('fr');
    expect(pickLanguage(['EN-us'])).toBe('en');
    expect(pickLanguage(['it', 'es'])).toBe('en');
    expect(pickLanguage([])).toBe('en');
  });

  const dates: FlexDate[] = [
    { y: 1923, m: 3, d: 12 },
    { y: 1923, m: 3, d: 1 },
    { y: 1923, m: 3 },
    { y: 1923 },
    { y: 1850, q: 'about' },
    { y: 1900, q: 'before' },
    { y: 1900, q: 'after' },
    { y: 1890, q: 'between', y2: 1895 },
    { text: 'Ostern 1920' },
  ];

  describe.each(LANGUAGES.map((l) => [l.code]))('%s', (code) => {
    afterEach(() => setLanguage('de'));

    // The person dialog fills its date fields with fmtDate and reads them back on every input.
    it('reads every displayed date back unchanged', () => {
      setLanguage(code);
      for (const date of dates) expect(parseDate(fmtDate(date))).toEqual(date);
    });

    // The card's year line must still fit in every language (user, 2026-10-25).
    it('keeps the year line on the card no longer than in German', () => {
      const longest = () =>
        Math.max(
          ...dates.map((date) => cardLine({ id: 'a', birth: { date }, death: { date } }).length),
        );
      setLanguage('de');
      const german = longest();
      setLanguage(code);
      expect(longest()).toBeLessThanOrEqual(german);
    });
  });
});
