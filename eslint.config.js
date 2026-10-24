import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

/** Browser APIs that could send data off the device. Forbidden in app code (PRIV-01/02). */
const NETWORK_GLOBALS = [
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'RTCPeerConnection',
].map((name) => ({
  name,
  message: 'Privacy: the app must never use the network (see PRIV-01/02).',
}));

export default ts.config(
  {
    ignores: [
      'dist/',
      'release/',
      'coverage/',
      'test-results/',
      'playwright-report/',
      'node_modules/',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        svelteConfig,
      },
    },
  },
  {
    // App code: browser only, no network.
    files: ['src/**/*.{ts,svelte}'],
    languageOptions: { globals: globals.browser },
    rules: {
      'no-restricted-globals': ['error', ...NETWORK_GLOBALS],
      'no-restricted-properties': [
        'error',
        {
          object: 'navigator',
          property: 'sendBeacon',
          message: 'Privacy: no network (PRIV-01/02).',
        },
        { object: 'window', property: 'fetch', message: 'Privacy: no network (PRIV-01/02).' },
      ],
    },
  },
  {
    // core/ is pure logic: no DOM, so it stays unit-testable and reusable (see architecture.md).
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...NETWORK_GLOBALS,
        ...['window', 'document', 'localStorage', 'indexedDB', 'navigator'].map((name) => ({
          name,
          message: 'core/ must not use browser APIs – put this in storage/ or ui/.',
        })),
      ],
    },
  },
);
