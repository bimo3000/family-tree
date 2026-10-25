import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

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
