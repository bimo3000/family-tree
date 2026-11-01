import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test as base, expect, type Dialog, type Request } from '@playwright/test';

const APP_FILE = resolve(import.meta.dirname, '../../dist/Stammbaum.html');

/** file:// URL of the built app, the way end users open it by double-click. */
export const APP_URL = pathToFileURL(APP_FILE).href;

/**
 * Where GitHub Pages serves the app (GEN-09). `openHosted` answers this one address with the built file inside the
 * browser, so the app runs on a real https origin without any server or network.
 */
export const HOSTED_URL = 'https://bimo3000.github.io/family-tree/';

type Fixtures = {
  /** Opens the built app and records any network activity and console errors. */
  app: {
    open: () => Promise<void>;
    /** Opens the app as if loaded from GitHub Pages (HOSTED_URL). */
    openHosted: () => Promise<void>;
    /** Opens the app and, from the start screen, the embedded example family. */
    openExample: () => Promise<void>;
    /** Reloads, confirming the browser's "Seite verlassen?" question. Tells whether it was asked. */
    reload: () => Promise<boolean>;
    networkRequests: string[];
    consoleErrors: string[];
  };
};

/**
 * Every E2E test should use `app` instead of `page.goto` directly. After each test it asserts
 * the two privacy/quality invariants automatically:
 *   - no request left the file (PRIV-01/02): anything that is not file:, data: or blob: fails
 *   - no console errors / uncaught exceptions
 */
export const test = base.extend<Fixtures>({
  app: async ({ page }, use) => {
    if (!existsSync(APP_FILE)) throw new Error('dist/Stammbaum.html missing – run `npm run build`');

    const networkRequests: string[] = [];
    const consoleErrors: string[] = [];
    const isLocal = (r: Request) =>
      /^(file|data|blob|about):/.test(r.url()) || r.url() === HOSTED_URL;

    page.on('request', (r) => {
      if (!isLocal(r)) networkRequests.push(r.url());
    });
    // Defense in depth: abort anything non-local, so a leak can never really go out.
    await page.route(/^(?!file:|data:|blob:|about:)/, (route) => route.abort());
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(`Uncaught: ${err.message}`));

    await use({
      open: async () => {
        await page.goto(APP_URL);
      },
      openHosted: async () => {
        // Registered after the abort-all route, so it wins for exactly this address.
        const html = readFileSync(APP_FILE);
        await page.route(HOSTED_URL, (route) =>
          route.fulfill({ body: html, contentType: 'text/html; charset=utf-8' }),
        );
        await page.goto(HOSTED_URL);
      },
      reload: async () => {
        let asked = false;
        const onDialog = (dialog: Dialog) => {
          asked = dialog.type() === 'beforeunload';
          void dialog.accept();
        };
        page.on('dialog', onDialog);
        await page.reload();
        page.off('dialog', onDialog);
        return asked;
      },
      openExample: async () => {
        await page.goto(APP_URL);
        await page.getByRole('button', { name: 'Beispiel ansehen' }).click();
        await expect(page.locator('.card').first()).toBeVisible();
      },
      networkRequests,
      consoleErrors,
    });

    expect(networkRequests, 'app must not make any network request').toEqual([]);
    expect(consoleErrors, 'app must not log errors').toEqual([]);
  },
});

export { expect };
