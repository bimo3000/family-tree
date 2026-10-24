import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const card = (page: Page, id: string) => page.locator(`.card[data-id="${id}"]`);
const panel = (page: Page) => page.getByRole('complementary', { name: 'Details' });
const dialog = (page: Page) => page.getByRole('dialog');
const menu = async (page: Page, entry: string) => {
  await page.getByRole('heading', { level: 1 }).getByRole('button').click();
  await page.locator('.menu').getByRole('button', { name: entry }).click();
};

/** A 3000 × 2000 PNG, drawn in the page: the left half red, the right half blue. */
async function bigPicture(page: Page): Promise<Buffer> {
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 3000;
    canvas.height = 2000;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#c00000';
    context.fillRect(0, 0, 1500, 2000);
    context.fillStyle = '#0000c0';
    context.fillRect(1500, 0, 1500, 2000);
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!)));
    return [...new Uint8Array(await blob.arrayBuffer())];
  });
  return Buffer.from(bytes);
}

type PictureFile = { name: string; mimeType: string; buffer: Buffer };

/** Chooses the file; the crop view opens (PERS-08). */
async function choosePhoto(page: Page, file: PictureFile) {
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    dialog(page).getByRole('button', { name: 'Foto wählen …' }).click(),
  ]);
  await chooser.setFiles(file);
}

/** Chooses the file and keeps the part the crop view suggests. */
async function addPhoto(page: Page, file: PictureFile) {
  await choosePhoto(page, file);
  await dialog(page).getByRole('button', { name: 'Übernehmen' }).click();
}

const karl = async (page: Page) => ({
  name: 'karl.png',
  mimeType: 'image/png',
  buffer: await bigPicture(page),
});

const naturalSize = (page: Page, id: string) =>
  card(page, id)
    .locator('img')
    .evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight]);

/** 'red' or 'blue': the colour in the middle of the stored picture. */
const storedColour = (page: Page, id: string) =>
  card(page, id)
    .locator('img')
    .evaluate((img: HTMLImageElement) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d')!;
      context.drawImage(img, img.naturalWidth / 2, img.naturalHeight / 2, 1, 1, 0, 0, 1, 1);
      const [r = 0, , b = 0] = context.getImageData(0, 0, 1, 1).data;
      return r > b ? 'red' : 'blue';
    });

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

test('a photo is cut to the frame shape, scaled down to 2000 px and shown on card and panel (PERS-03, PERS-08, DATA-07)', async ({
  app,
  page,
}) => {
  await addPhoto(page, await karl(page));
  await expect(card(page, 'p_karl').locator('img')).toBeVisible();
  // 3000 × 2000 → the largest 7:5 part (2800 × 2000) → 2000 × 1429.
  await expect.poll(() => naturalSize(page, 'p_karl')).toEqual([2000, 1429]);
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
  await expect.poll(() => naturalSize(page, 'p_karl')).toEqual([2000, 1429]);
});

test('a zoomed part is cut from the original, not enlarged (PERS-08)', async ({ page }) => {
  await choosePhoto(page, await karl(page));
  await expect(dialog(page).getByRole('heading', { name: 'Ausschnitt wählen' })).toBeVisible();
  await dialog(page).getByLabel('Größe').fill('2');
  await dialog(page).getByRole('button', { name: 'Übernehmen' }).click();
  await expect.poll(() => naturalSize(page, 'p_karl')).toEqual([1400, 1000]);
  await expect(dialog(page).getByRole('heading', { name: 'Person bearbeiten' })).toBeVisible();
});

test('the part is moved with the mouse or the arrow keys (PERS-08)', async ({ page }) => {
  await choosePhoto(page, await karl(page));
  await dialog(page).getByLabel('Größe').fill('2');
  // Dragging the photo to the left shows its right (blue) side.
  const frame = dialog(page).getByRole('button', { name: 'Foto verschieben' });
  const box = (await frame.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 10, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  await dialog(page).getByRole('button', { name: 'Übernehmen' }).click();
  await expect.poll(() => storedColour(page, 'p_karl')).toBe('blue');

  // The arrow keys move the photo too: to the right, so its left (red) side shows.
  await choosePhoto(page, await karl(page));
  await dialog(page).getByLabel('Größe').fill('2');
  await frame.focus();
  for (let i = 0; i < 30; i++) await page.keyboard.press('ArrowRight');
  await dialog(page).getByRole('button', { name: 'Übernehmen' }).click();
  await expect.poll(() => storedColour(page, 'p_karl')).toBe('red');
});

test('cancelling the crop view adds no photo (PERS-08)', async ({ page }) => {
  await choosePhoto(page, await karl(page));
  await dialog(page).getByRole('button', { name: 'Abbrechen' }).click();
  await expect(dialog(page).getByRole('heading', { name: 'Person bearbeiten' })).toBeVisible();
  // Esc also only leaves the crop view, not the person dialog.
  await choosePhoto(page, await karl(page));
  await page.keyboard.press('Escape');
  await expect(dialog(page).getByRole('heading', { name: 'Person bearbeiten' })).toBeVisible();
  await expect(card(page, 'p_karl').locator('img')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Rückgängig' })).toBeDisabled();
});

test('a photo can be removed, and editing keeps it', async ({ page }) => {
  await addPhoto(page, await karl(page));
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
