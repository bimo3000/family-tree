import { inflateRawSync, crc32 } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { createZip } from '../../scripts/lib/zip.mjs';

/** Tiny ZIP reader via the central directory – just enough to verify our writer. */
function readZip(zip: Buffer): Map<string, Buffer> {
  const eocd = zip.length - 22;
  expect(zip.readUInt32LE(eocd)).toBe(0x06054b50);
  const count = zip.readUInt16LE(eocd + 10);
  let p = zip.readUInt32LE(eocd + 16);
  const files = new Map<string, Buffer>();
  for (let i = 0; i < count; i++) {
    expect(zip.readUInt32LE(p)).toBe(0x02014b50);
    const crc = zip.readUInt32LE(p + 16);
    const size = zip.readUInt32LE(p + 20);
    const nameLen = zip.readUInt16LE(p + 28);
    const localOffset = zip.readUInt32LE(p + 42);
    const name = zip.toString('utf8', p + 46, p + 46 + nameLen);
    const localNameLen = zip.readUInt16LE(localOffset + 26);
    const dataStart = localOffset + 30 + localNameLen;
    const data = inflateRawSync(zip.subarray(dataStart, dataStart + size));
    expect(crc32(data)).toBe(crc);
    files.set(name, data);
    p += 46 + nameLen;
  }
  return files;
}

describe('createZip', () => {
  it('round-trips files including UTF-8 names', () => {
    const input = [
      { name: 'Stammbaum/Stammbaum.html', data: Buffer.from('<!doctype html><p>Hallo</p>') },
      { name: 'Stammbaum/Anleitung für Oma.txt', data: Buffer.from('Größe: äöüß') },
      { name: 'Stammbaum/leer.txt', data: Buffer.alloc(0) },
    ];
    const files = readZip(createZip(input, new Date(2026, 9, 24, 12, 0, 0)));
    expect([...files.keys()]).toEqual(input.map((f) => f.name));
    for (const f of input) expect(files.get(f.name)?.equals(f.data)).toBe(true);
  });

  it('compresses repetitive content', () => {
    const big = Buffer.from('Stammbaum '.repeat(10_000));
    expect(createZip([{ name: 'a.txt', data: big }]).length).toBeLessThan(big.length / 10);
  });
});
