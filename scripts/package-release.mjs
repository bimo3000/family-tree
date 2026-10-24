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
// No dependencies: uses Node's built-in zlib for compression and CRC32.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';

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

/**
 * Minimal ZIP writer (deflate, UTF-8 file names). Good enough for a handful of files;
 * readable by Windows Explorer, macOS Finder and Linux tools.
 * @param {{ name: string, data: Buffer }[]} files
 */
function createZip(files) {
  const local = [];
  const central = [];
  let offset = 0;
  const { time, date } = dosDateTime(new Date());

  for (const { name, data } of files) {
    const nameBuf = Buffer.from(name, 'utf8');
    const compressed = deflateRawSync(data, { level: 9 });
    const crc = crc32(data);

    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); // local file header signature
    header.writeUInt16LE(20, 4); // version needed
    header.writeUInt16LE(0x0800, 6); // flags: UTF-8 names
    header.writeUInt16LE(8, 8); // method: deflate
    header.writeUInt16LE(time, 10);
    header.writeUInt16LE(date, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(nameBuf.length, 26);
    header.writeUInt16LE(0, 28); // extra length
    local.push(header, nameBuf, compressed);

    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0); // central directory signature
    dir.writeUInt16LE(20, 4); // version made by
    dir.writeUInt16LE(20, 6); // version needed
    dir.writeUInt16LE(0x0800, 8);
    dir.writeUInt16LE(8, 10);
    dir.writeUInt16LE(time, 12);
    dir.writeUInt16LE(date, 14);
    dir.writeUInt32LE(crc, 16);
    dir.writeUInt32LE(compressed.length, 20);
    dir.writeUInt32LE(data.length, 24);
    dir.writeUInt16LE(nameBuf.length, 28);
    // extra len, comment len, disk no., internal attrs, external attrs: all 0
    dir.writeUInt32LE(offset, 42);
    central.push(dir, nameBuf);

    offset += header.length + nameBuf.length + compressed.length;
  }

  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); // end of central directory signature
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, centralBuf, end]);
}

/** @param {Date} d */
function dosDateTime(d) {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}
