#!/usr/bin/env node
// Refreshes the committed app folder at the repo root (ADR-0002). Run it when a version is released:
//
//   Stammbaum/
//     ├─ Stammbaum.html        ← the whole app, double-click to start
//     ├─ Anleitung.txt         ← quick guide in German, English and French
//     ├─ Guide.txt                (from docs/user-guide/Anleitung.md, Guide.md, Mode-d-emploi.md)
//     ├─ Mode-d-emploi.txt
//     ├─ LICENSES.txt          ← MIT licence of the app + licences of the bundled libraries (dist/licenses.md)
//     └─ Beispiel.stammbaum    ← fictional example family, made from examples/familie-brandt.json
//
// Whoever wants to email the app zips this folder. Expects `npm run build` to have run (`npm run release` does that).

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createProjectFile } from './lib/zip.mjs';

const root = new URL('..', import.meta.url).pathname;

const app = join(root, 'dist', 'Stammbaum.html');
if (!existsSync(app)) {
  console.error('dist/Stammbaum.html missing – run `npm run build` first.');
  process.exit(1);
}

/** @type {{ name: string, data: Buffer }[]} */
const files = [{ name: 'Stammbaum.html', data: readFileSync(app) }];

for (const name of ['Anleitung', 'Guide', 'Mode-d-emploi']) {
  const guide = join(root, 'docs', 'user-guide', `${name}.md`);
  // CRLF and a byte-order mark so that Notepad on older Windows shows line breaks and umlauts correctly.
  const text = readFileSync(guide, 'utf8').replace(/\r?\n/g, '\r\n');
  files.push({ name: `${name}.txt`, data: Buffer.from('\uFEFF' + text, 'utf8') });
}

// MIT asks that the licence texts travel with every copy: ours plus those Vite collected at build time.
const licenses = [
  readFileSync(join(root, 'LICENSE'), 'utf8'),
  readFileSync(join(root, 'dist', 'licenses.md'), 'utf8'),
]
  .join('\n\n')
  .replace(/\r?\n/g, '\r\n');
files.push({ name: 'LICENSES.txt', data: Buffer.from(licenses, 'utf8') });

// Built here from the JSON the app embeds, so the two can never drift apart (DATA-06).
const example = readFileSync(join(root, 'examples', 'familie-brandt.json'));
files.push({ name: 'Beispiel.stammbaum', data: createProjectFile(example) });

// Start from an empty folder, so a file dropped from this list doesn't linger.
const outDir = join(root, 'Stammbaum');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir);
for (const f of files) writeFileSync(join(outDir, f.name), f.data);

console.log(`✓ ${outDir}`);
for (const f of files) console.log(`    ${f.name} (${Math.ceil(f.data.length / 1024)} kB)`);
