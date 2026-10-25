import { defineConfig, devices } from '@playwright/test';

/**
 * Records the README demo GIF (`npm run demo-gif`). Kept apart from the E2E suite so that
 * `npm run verify` never runs it. Chromium only, English UI.
 */
export default defineConfig({
  testDir: '.',
  outputDir: '../../test-results/demo-gif-output',
  timeout: 120_000,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    locale: 'en-US',
    viewport: { width: 1100, height: 690 },
    deviceScaleFactor: 1,
  },
});
