#!/usr/bin/env node
// Builds the distributable zip that can be emailed to family members:
//
//   release/Stammbaum-<version>.zip
//     └─ Stammbaum/
//         ├─ Stammbaum.html        ← the whole app, double-click to start
//         ├─ Anleitung.txt         ← German quick guide (from docs/user-guide/Anleitung.md)
//         └─ Beispiel.stammbaum    ← fictional example family (once it exists)
//
// Expects `npm run build` to have run (the `package` npm script does that).
// No dependencies: the zip writer in scripts/lib/zip.mjs uses Node's built-in zlib.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createZip } from './lib/zip.mjs';

const root = new URL('..', import.meta.url).pathname;
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const app = join(root, 'dist', 'Stammbaum.html');
if (!existsSync(app)) {
  console.error('dist/Stammbaum.html missing – run `npm run build` first.');
  process.exit(1);
}

/** @type {{ name: string, data: Buffer }[]} */
const entries = [{ name: 'Stammbaum/Stammbaum.html', data: readFileSync(app) }];

const guide = join(root, 'docs', 'user-guide', 'Anleitung.md');
if (existsSync(guide)) {
  // CRLF so that Notepad on older Windows shows line breaks correctly.
  const text = readFileSync(guide, 'utf8').replace(/\r?\n/g, '\r\n');
  entries.push({ name: 'Stammbaum/Anleitung.txt', data: Buffer.from('﻿' + text, 'utf8') });
}

const examples = join(root, 'examples');
if (existsSync(examples)) {
  for (const f of readdirSync(examples).filter((f) => f.endsWith('.stammbaum'))) {
    entries.push({ name: `Stammbaum/${f}`, data: readFileSync(join(examples, f)) });
  }
}

const outDir = join(root, 'release');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, `Stammbaum-${version}.zip`);
writeFileSync(outFile, createZip(entries));

console.log(`✓ ${outFile}`);
for (const e of entries) console.log(`    ${e.name} (${Math.ceil(e.data.length / 1024)} kB)`);
