import type { Page } from '@playwright/test';
import { de } from '../../src/ui/i18n/de';
import { en } from '../../src/ui/i18n/en';
import { fr } from '../../src/ui/i18n/fr';
import { test, expect } from './fixtures';

// GEN-05: German, English and French. The other E2E tests run in German (locale de-DE).

const card = (page: Page, id: string) => page.locator(`.card[data-id="${id}"]`);
const panel = (page: Page) => page.getByRole('complementary');
const dialog = (page: Page) => page.getByRole('dialog');
const languages = (page: Page) => page.getByRole('group', { name: /Sprache|Language|Langue/ });

/** Waits until the browser has remembered the chosen language, so a reload finds it. */
async function waitUntilRemembered(page: Page, code: string) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<unknown>((resolve, reject) => {
            const open = indexedDB.open('stammbaum', 1);
            open.onerror = () => reject(open.error);
            open.onsuccess = () => {
              const get = open.result.transaction('state').objectStore('state').get('language');
              get.onsuccess = () => {
                open.result.close();
                resolve(get.result);
              };
            };
          }),
      ),
    )
    .toBe(code);
}

/** Types the dates into the person dialog of Karl and closes it. */
async function setDates(page: Page, texts: typeof de, born: string, died: string) {
  await card(page, 'p_karl').click();
  await panel(page).getByRole('button', { name: texts.panel.edit, exact: true }).click();
  await dialog(page).getByLabel(texts.personDialog.born).fill(born);
  await dialog(page).getByLabel(texts.personDialog.died).fill(died);
  await dialog(page).getByRole('button', { name: texts.common.done }).click();
  await expect(dialog(page)).toBeHidden();
}

test.describe('without a choice, the browser language is used', () => {
  for (const [locale, texts, lang] of [
    ['en-US', en, 'en'],
    ['fr-FR', fr, 'fr'],
    ['de-AT', de, 'de'],
    ['it-IT', en, 'en'],
  ] as const) {
    test.describe(locale, () => {
      test.use({ locale });
      test(`starts in ${texts.name}`, async ({ app, page }) => {
        await app.open();
        await expect(page.getByRole('button', { name: texts.start.new })).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        await expect(languages(page).getByRole('button', { name: texts.name })).toHaveAttribute(
          'aria-pressed',
          'true',
        );
      });
    });
  }
});

test('the language chosen on the start screen stays after a reload', async ({ app, page }) => {
  await app.open();
  await languages(page).getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('button', { name: en.start.new })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await waitUntilRemembered(page, 'en');
  await app.reload();
  await expect(page.getByRole('button', { name: en.start.new })).toBeVisible();
});

test('the language can be changed in the menu of an open tree', async ({ app, page }) => {
  await app.openExample();
  await card(page, 'p_peter').click();
  await expect(panel(page).getByText(de.panel.parents, { exact: true })).toBeVisible();

  await page.getByRole('heading', { level: 1 }).getByRole('button').click();
  await languages(page).getByRole('button', { name: 'Français' }).click();
  // The menu closes, everything shown switches at once, the tree stays as it is.
  await expect(languages(page)).toBeHidden();
  await expect(page.getByRole('button', { name: fr.project.save, exact: true })).toBeVisible();
  await expect(panel(page).getByText(fr.panel.parents, { exact: true })).toBeVisible();
  await expect(panel(page).getByRole('button', { name: fr.panel.edit, exact: true })).toBeVisible();
  await waitUntilRemembered(page, 'fr');

  await app.reload();
  await expect(page.getByRole('button', { name: fr.project.save, exact: true })).toBeVisible();
});

test.describe('English', () => {
  test.use({ locale: 'en-GB' });

  test('dates are typed and shown in English', async ({ app, page }) => {
    await app.open();
    await page.getByRole('button', { name: en.start.example }).click();
    await card(page, 'p_karl').click();
    await panel(page).getByRole('button', { name: en.panel.edit, exact: true }).click();
    await dialog(page).getByLabel(en.personDialog.born).fill('12 March 1923');
    await expect(dialog(page)).toContainText('→ 12 March 1923');
    await dialog(page).getByLabel(en.personDialog.died).fill('before 2001');
    await expect(dialog(page)).toContainText('→ before 2001');
    await expect(card(page, 'p_karl')).toContainText('* 1923 † bef. 2001');
    await dialog(page).getByRole('button', { name: en.common.done }).click();

    await expect(panel(page)).toContainText('12 Mar 1923');
    await expect(panel(page)).toContainText('before 2001');
    await expect(panel(page).getByText(en.panel.children, { exact: true })).toBeVisible();
  });
});

test.describe('French', () => {
  test.use({ locale: 'fr-FR' });

  test('dates are typed and shown in French', async ({ app, page }) => {
    await app.open();
    await page.getByRole('button', { name: fr.start.example }).click();
    await card(page, 'p_karl').click();
    await panel(page).getByRole('button', { name: fr.panel.edit, exact: true }).click();
    await dialog(page).getByLabel(fr.personDialog.born).fill('1er mars 1923');
    await expect(dialog(page)).toContainText('→ 1er mars 1923');
    await dialog(page).getByLabel(fr.personDialog.died).fill('vers 2001');
    await expect(dialog(page)).toContainText('→ vers 2001');
    await expect(card(page, 'p_karl')).toContainText('* 1923 † v. 2001');
    await dialog(page).getByRole('button', { name: fr.common.done }).click();

    await expect(panel(page)).toContainText('01/03/1923');
    await expect(panel(page)).toContainText('vers 2001');
    await expect(panel(page).getByText(fr.panel.children, { exact: true })).toBeVisible();
  });
});

// The user's condition for the languages: birth and death must still fit on the card (2026-10-25).
test.describe('the longest year line fits on the card', () => {
  for (const [locale, texts] of [
    ['de-DE', de],
    ['en-US', en],
    ['fr-FR', fr],
  ] as const) {
    test.describe(locale, () => {
      test.use({ locale });
      test(texts.name, async ({ app, page }) => {
        await app.open();
        await page.getByRole('button', { name: texts.start.example }).click();
        await setDates(page, texts, 'zw. 1890 und 1895', 'zw. 1920 und 1925');
        const yr = card(page, 'p_karl').locator('.yr');
        await expect(yr).toContainText('1895');
        expect(await yr.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      });
    });
  }
});
