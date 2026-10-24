import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against the BUILT app (dist/Stammbaum.html) opened via file:// –
 * exactly the way end users start it. `npm run build` must run first (`npm run verify` does).
 *
 * Three engines: Chromium (Chrome/Edge), Firefox, WebKit (≈ Safari on macOS).
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
    locale: 'de-DE',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
