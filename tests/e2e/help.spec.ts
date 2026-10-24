import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const menu = async (page: Page, entry: string) => {
  await page.getByRole('heading', { level: 1 }).getByRole('button').click();
  await page.locator('.menu').getByRole('button', { name: entry }).click();
};
const hint = (page: Page) => page.getByText('Klick auf eine Person, um Details zu sehen.');

/** Waits until the browser has remembered that the hint was seen, so a reload finds it. */
async function waitUntilRemembered(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<unknown>((resolve, reject) => {
            const open = indexedDB.open('stammbaum', 1);
            open.onerror = () => reject(open.error);
            open.onsuccess = () => {
              const get = open.result
                .transaction('state')
                .objectStore('state')
                .get('seen:tree-hint');
              get.onsuccess = () => {
                open.result.close();
                resolve(get.result);
              };
            };
          }),
      ),
    )
    .toBe(true);
}

test('"Hilfe" in the menu opens a short help, and it closes again', async ({ app, page }) => {
  await app.openExample();
  await menu(page, 'Hilfe');
  const help = page.getByRole('dialog', { name: 'Hilfe' });
  for (const section of [
    'Personen hinzufügen',
    'Baum bewegen und zoomen',
    'Beziehungen ändern',
    'Speichern und Sichern',
    'Drucken',
  ])
    await expect(help.getByRole('heading', { name: section, exact: true })).toBeVisible();
  await help.getByRole('button', { name: 'Schließen' }).click();
  await expect(help).toBeHidden();

  await menu(page, 'Hilfe');
  await page.keyboard.press('Escape');
  await expect(help).toBeHidden();
});

test('the first-use hint shows until it is closed, also after a reload', async ({ app, page }) => {
  await app.openExample();
  await expect(hint(page)).toBeVisible();
  await page.locator('.hint').getByRole('button', { name: 'Ausblenden' }).click();
  await expect(hint(page)).toBeHidden();
  await waitUntilRemembered(page);
  await app.reload();
  await expect(page.locator('.card').first()).toBeVisible();
  await expect(hint(page)).toBeHidden();
});

test('selecting a person is enough to retire the hint', async ({ app, page }) => {
  await app.openExample();
  await expect(hint(page)).toBeVisible();
  await page.locator('.card[data-id="p_karl"]').click();
  await expect(hint(page)).toBeHidden();
  await waitUntilRemembered(page);
  await app.reload();
  await expect(page.locator('.card').first()).toBeVisible();
  await expect(hint(page)).toBeHidden();
});
