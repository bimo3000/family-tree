import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

/** Name of the single deliverable file end users double-click. */
export const OUTPUT_FILE = 'Stammbaum.html';

/**
 * Content-Security-Policy for the built app (privacy guard, see ADR-0003).
 * The browser itself refuses every network connection and every external resource,
 * so even a bug or a compromised dependency cannot send family data anywhere.
 * Only applied to the production build: the dev server needs a websocket for live reload.
 */
export const CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  'img-src data: blob:',
  'font-src data:',
  "connect-src 'none'",
  "worker-src 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join('; ');

function offlineSingleFile(): Plugin {
  return {
    name: 'stammbaum:offline-single-file',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      const charset = '<meta charset="UTF-8" />';
      if (!html.includes(charset)) throw new Error(`index.html must contain ${charset}`);
      return html.replace(
        charset,
        `${charset}\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      );
    },
    generateBundle(_options, bundle) {
      const index = bundle['index.html'];
      if (index) index.fileName = OUTPUT_FILE;
    },
  };
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [svelte(), viteSingleFile({ removeViteModuleLoader: true }), offlineSingleFile()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Everything is inlined into one HTML file; a large chunk is expected.
    chunkSizeWarningLimit: 5000,
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
