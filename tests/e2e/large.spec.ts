import { packProject } from '../../src/storage/projectFile';
import { generatedFamily } from '../fixtures/layout-families';
import { test, expect } from './fixtures';

/** TREE-05: a tree of about 100 persons, opened from a file, displays and reacts smoothly. */
test('a tree of 100 persons opens and reacts quickly', async ({ app, page }) => {
  const buffer = Buffer.from(packProject(generatedFamily(100), new Map(), 'test'));
  await page.addInitScript(() =>
    Object.defineProperty(window, 'showOpenFilePicker', { value: undefined, configurable: true }),
  );
  await app.open();
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Stammbaum-Datei öffnen' }).click(),
  ]);
  const start = Date.now();
  await chooser.setFiles({ name: 'gross.stammbaum', mimeType: 'application/zip', buffer });
  await expect(page.locator('.card')).toHaveCount(100);
  expect(Date.now() - start, 'opening and drawing').toBeLessThan(3000);

  await page.locator('.card[data-id="g40"]').click();
  await expect(page.getByRole('button', { name: 'Bearbeiten', exact: true })).toBeVisible();

  // Measured inside the page, from the click until the next frame is drawn, so the test robot's
  // own waiting doesn't count. Generous limits: they catch a sluggish tree, not a slow machine.
  const [openDialog, change] = await page.evaluate(async () => {
    const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    // First let the selection settle (fading the others is slow in Playwright's WebKit on Linux).
    for (let quiet = 0; quiet < 5;) {
      const t0 = performance.now();
      await frame();
      quiet = performance.now() - t0 < 50 ? quiet + 1 : 0;
    }
    const edit = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Bearbeiten',
    )!;
    let t = performance.now();
    edit.click();
    await frame();
    const opened = performance.now() - t;
    const field = document.querySelector<HTMLInputElement>('dialog input[type="text"]')!;
    t = performance.now();
    field.value = 'Umbenannt';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    await frame();
    return [opened, performance.now() - t];
  });
  await expect(page.locator('.card[data-id="g40"]')).toContainText('Umbenannt');
  expect(openDialog, 'opening the person dialog (ms)').toBeLessThan(1000);
  expect(change, 'a change, with the layout recomputed (ms)').toBeLessThan(1000);
});
