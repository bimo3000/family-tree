import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const card = (page: Page, id: string) => page.locator(`.card[data-id="${id}"]`);
const panel = (page: Page) => page.getByRole('complementary', { name: 'Details' });
const dialog = (page: Page) => page.getByRole('dialog');
const menu = async (page: Page, entry: string) => {
  await page.getByRole('heading', { level: 1 }).getByRole('button').click();
  await page.locator('.menu').getByRole('button', { name: entry }).click();
};

/** A plain 3000 × 2000 PNG, drawn in the page. */
async function bigPicture(page: Page): Promise<Buffer> {
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 3000;
    canvas.height = 2000;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#b5552f';
    context.fillRect(0, 0, 3000, 2000);
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!)));
    return [...new Uint8Array(await blob.arrayBuffer())];
  });
  return Buffer.from(bytes);
}

async function choosePhoto(page: Page, file: { name: string; mimeType: string; buffer: Buffer }) {
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    dialog(page).getByRole('button', { name: 'Foto wählen …' }).click(),
  ]);
  await chooser.setFiles(file);
}

const naturalSize = (page: Page, id: string) =>
  card(page, id)
    .locator('img')
    .evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight]);

test.beforeEach(async ({ app, page }) => {
  // The download path, the same in every engine.
  await page.addInitScript(() => {
    for (const name of ['showOpenFilePicker', 'showSaveFilePicker'])
      Object.defineProperty(window, name, { value: undefined, configurable: true });
  });
  await app.openExample();
  await card(page, 'p_karl').click();
  await panel(page).getByRole('button', { name: 'Bearbeiten', exact: true }).click();
});

test('a photo is scaled down to 2000 px and shown on card and panel (PERS-03, DATA-07)', async ({
  app,
  page,
}) => {
  await choosePhoto(page, {
    name: 'karl.png',
    mimeType: 'image/png',
    buffer: await bigPicture(page),
  });
  await expect(card(page, 'p_karl').locator('img')).toBeVisible();
  await expect.poll(() => naturalSize(page, 'p_karl')).toEqual([2000, 1333]);
  await expect(dialog(page).locator('.f-photo img')).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Fertig' }).click();
  await expect(panel(page).locator('.p-photo img')).toBeVisible();

  // Undo and redo, like any change.
  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(card(page, 'p_karl').locator('img')).toHaveCount(0);
  await page.getByRole('button', { name: 'Wiederholen' }).click();
  await expect(card(page, 'p_karl').locator('img')).toBeVisible();

  // It survives a reload (working copy) and a save and open (the file).
  await app.reload();
  await expect(card(page, 'p_karl').locator('img')).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Speichern', exact: true }).click(),
  ]);
  const path = await download.path();
  await dialog(page).getByRole('button', { name: 'Verstanden' }).click();
  await menu(page, 'Beispiel ansehen');
  await expect(card(page, 'p_karl').locator('img')).toHaveCount(0);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), menu(page, 'Öffnen …')]);
  await chooser.setFiles(path);
  await expect.poll(() => naturalSize(page, 'p_karl')).toEqual([2000, 1333]);
});

test('a photo can be removed, and editing keeps it', async ({ page }) => {
  await choosePhoto(page, {
    name: 'karl.png',
    mimeType: 'image/png',
    buffer: await bigPicture(page),
  });
  await expect(card(page, 'p_karl').locator('img')).toBeVisible();
  // Typing after choosing a photo must not lose it.
  await dialog(page).getByLabel('Vornamen').fill('Carl');
  await expect(card(page, 'p_karl')).toContainText('Carl Brandt');
  await expect(card(page, 'p_karl').locator('img')).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Foto entfernen' }).click();
  await expect(card(page, 'p_karl').locator('img')).toHaveCount(0);
  await expect(card(page, 'p_karl')).toContainText('CB');
});

test('a picture the browser cannot read gets a friendly message', async ({ page }) => {
  await choosePhoto(page, {
    name: 'IMG_0001.heic',
    mimeType: 'image/heic',
    buffer: Buffer.from('not really a picture'),
  });
  await expect(page.getByRole('status')).toContainText('Bitte speichere es als JPG');
  await expect(card(page, 'p_karl').locator('img')).toHaveCount(0);
});
