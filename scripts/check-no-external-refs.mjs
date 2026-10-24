#!/usr/bin/env node
// Privacy guard for the built app (PRIV-01/02): fails if the HTML references anything outside itself.
//
// Two checks:
//  1. No tag loads an external or separate file (script src, link href, img src, ...).
//     The app must be ONE self-contained file.
//  2. Every http(s):// URL anywhere in the file is on a small allow-list of known-harmless
//     strings (XML namespace identifiers, Svelte's error-documentation links in error messages).
//     Anything new must be looked at by a human/agent and either removed or consciously allowed.
//
// The Content-Security-Policy in the HTML is the runtime enforcement; this script is the
// early warning at build time.
//
// Usage: node scripts/check-no-external-refs.mjs dist/Stammbaum.html

import { readFileSync } from 'node:fs';

const ALLOWED_URL_PREFIXES = [
  'http://www.w3.org/', // XML/SVG/MathML namespace identifiers, never fetched
  'https://svelte.dev/e/', // links inside Svelte error messages, never fetched
];

const file = process.argv[2];
if (!file) {
  console.error('Usage: check-no-external-refs.mjs <file.html>');
  process.exit(2);
}

const html = readFileSync(file, 'utf8');
const problems = [];

// 1. Tags that would load a separate resource.
const resourceAttr =
  /<(script|link|img|iframe|source|video|audio|embed|object)\b[^>]*\s(src|href|data)\s*=\s*["']?([^"'\s>]+)/gi;
for (const m of html.matchAll(resourceAttr)) {
  const [, tag, attr, value = ''] = m;
  if (value.startsWith('data:') || value.startsWith('#')) continue;
  problems.push(`<${tag} ${attr}="${value}"> loads a separate resource`);
}

// 2. Any absolute URL must be allow-listed.
for (const m of html.matchAll(/(?:https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}[^\s"'`)<>]*/gi)) {
  const url = m[0];
  if (url.startsWith('//') && !/^\/\/[a-z0-9-]+\.[a-z]{2,}\//i.test(url)) continue; // comments like "// foo.bar"
  if (ALLOWED_URL_PREFIXES.some((p) => url.startsWith(p))) continue;
  problems.push(`unexpected URL: ${url}`);
}

if (problems.length > 0) {
  console.error(`✗ ${file} is not self-contained:`);
  for (const p of [...new Set(problems)]) console.error(`  - ${p}`);
  console.error(
    'Fix the source, or (only if harmless) extend ALLOWED_URL_PREFIXES with a comment why.',
  );
  process.exit(1);
}
console.log(`✓ ${file}: no external references`);
