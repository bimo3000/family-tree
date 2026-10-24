import type { Page } from '@playwright/test';
import { packProject } from '../../src/storage/projectFile';
import { PRINT_AREA } from '../../src/ui/tree/geometry';
import { generatedFamily } from '../fixtures/layout-families';
import { test, expect } from './fixtures';

const menu = async (page: Page, entry: string) => {
  await page.getByRole('heading', { level: 1 }).getByRole('button').click();
  await page.locator('.menu').getByRole('button', { name: entry }).click();
};

/** Every card lies inside the printed tree area, which fits on the page (UI-03). */
async function expectWholeTreeOnPage(page: Page) {
  const area = (await page.locator('.viewport').boundingBox())!;
  expect(area.width).toBeLessThanOrEqual(PRINT_AREA.width + 1);
  expect(area.height).toBeLessThanOrEqual(PRINT_AREA.height + 1);
  const boxes = await page
    .locator('.card')
    .evaluateAll((cards) => cards.map((c) => c.getBoundingClientRect().toJSON() as DOMRect));
  for (const b of boxes) {
    expect(b.left).toBeGreaterThanOrEqual(area.x - 1);
    expect(b.top).toBeGreaterThanOrEqual(area.y - 1);
    expect(b.right).toBeLessThanOrEqual(area.x + area.width + 1);
    expect(b.bottom).toBeLessThanOrEqual(area.y + area.height + 1);
  }
}

test('"Drucken / Als PDF speichern" opens the print dialog', async ({ app, page }) => {
  await page.addInitScript(() => {
    window.print = () => document.body.setAttribute('data-printed', 'yes');
  });
  await app.openExample();
  await menu(page, 'Drucken / Als PDF speichern');
  await expect(page.locator('body')).toHaveAttribute('data-printed', 'yes');
});

test('the printout shows the name and the whole tree, without bars and panel', async ({
  app,
  page,
}) => {
  await app.openExample();
  // Zoomed in and a person selected: the printout ignores both.
  await page.getByTitle('Vergrößern').click();
  await page.locator('.card[data-id="p_karl"]').click();
  await expect(page.getByRole('complementary', { name: 'Details' })).toBeVisible();

  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.topbar')).toBeHidden();
  await expect(page.getByRole('complementary', { name: 'Details' })).toBeHidden();
  await expect(page.locator('.zoom')).toBeHidden();
  await expect(page.locator('.print-title')).toHaveText('Familie Brandt');
  await expect(page.locator('.card.dim').first()).toHaveCSS('opacity', '1');
  await expectWholeTreeOnPage(page);

  await page.emulateMedia({ media: 'screen' });
  await expect(page.locator('.topbar')).toBeVisible();
  await expect(page.locator('.print-title')).toBeHidden();
});

test('a tree of 100 persons fits on the printed page', async ({ app, page }) => {
  const buffer = Buffer.from(packProject(generatedFamily(100), new Map(), 'test'));
  await page.addInitScript(() =>
    Object.defineProperty(window, 'showOpenFilePicker', { value: undefined, configurable: true }),
  );
  await app.open();
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Stammbaum-Datei öffnen' }).click(),
  ]);
  await chooser.setFiles({ name: 'gross.stammbaum', mimeType: 'application/zip', buffer });
  await expect(page.locator('.card')).toHaveCount(100);

  await page.emulateMedia({ media: 'print' });
  await expectWholeTreeOnPage(page);
});
