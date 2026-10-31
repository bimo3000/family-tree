import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createProjectFile } from '../../scripts/lib/zip.mjs';

// The committed app folder (ADR-0002, GEN-03, GEN-08, DATA-06), refreshed by `npm run release`.
const folder = new URL('../../Stammbaum/', import.meta.url);
const read = (name: string) => readFileSync(new URL(name, folder));

describe('the committed Stammbaum/ folder', () => {
  it('holds the app, the three guides, the licences and the example project', () => {
    expect(readdirSync(folder).sort()).toEqual(
      [
        'Anleitung.txt',
        'Beispiel.stammbaum',
        'Guide.txt',
        'LICENSES.txt',
        'Mode-d-emploi.txt',
        'Stammbaum.html',
      ].sort(),
    );
  });

  it('has the example built from the JSON the app embeds (DATA-06)', () => {
    const json = readFileSync(new URL('../../examples/familie-brandt.json', import.meta.url));
    expect(read('Beispiel.stammbaum').equals(createProjectFile(json))).toBe(true);
  });

  it('has the app of the current version (refresh with `npm run release` after a version bump)', () => {
    const { version } = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
    ) as { version: string };
    // The build inlines the version as a string literal (APP_VERSION in src/core/app-info.ts).
    const quoted = new RegExp(`["'\`]${version.replaceAll('.', '\\.')}["'\`]`);
    expect(read('Stammbaum.html').toString('utf8')).toMatch(quoted);
  });

  it('carries the MIT licence of the app and of the bundled libraries (GEN-08)', () => {
    const licences = read('LICENSES.txt').toString('utf8');
    expect(licences).toContain('MIT License');
    expect(licences).toContain('svelte');
    expect(licences).toContain('fflate');
  });
});
