import { readFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const card = (page: Page, id: string) => page.locator(`.card[data-id="${id}"]`);
const panel = (page: Page) => page.getByRole('complementary', { name: 'Details' });
const dialog = (page: Page) => page.getByRole('dialog');
const status = (page: Page) => page.locator('.topbar .status');
const menu = async (page: Page, entry: string) => {
  await page.getByRole('heading', { level: 1 }).getByRole('button').click();
  await page.locator('.menu').getByRole('button', { name: entry }).click();
};

/** Karl gets a new first name, through the person dialog. */
async function renameKarl(page: Page, name: string) {
  await card(page, 'p_karl').click();
  await panel(page).getByRole('button', { name: 'Bearbeiten', exact: true }).click();
  await dialog(page).getByLabel('Vornamen').fill(name);
  await dialog(page).getByRole('button', { name: 'Fertig' }).click();
  await expect(card(page, 'p_karl')).toContainText(`${name} Brandt`);
}

/** The project as the working copy in IndexedDB holds it (only after the app has created the database). */
function storedProject(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{ name: string; persons: { id: string; givenNames?: string }[] } | null>(
        (resolve, reject) => {
          const open = indexedDB.open('stammbaum', 1);
          open.onerror = () => reject(open.error);
          open.onsuccess = () => {
            const get = open.result.transaction('state').objectStore('state').get('project');
            get.onsuccess = () => {
              open.result.close();
              resolve(get.result?.project ?? null);
            };
          };
        },
      ),
  );
}
const storedName = async (page: Page, id: string) =>
  (await storedProject(page))?.persons.find((p) => p.id === id)?.givenNames;

/** Firefox and Safari have no File System Access; Chromium behaves the same without it. */
async function withoutFilePickers(page: Page) {
  await page.addInitScript(() => {
    for (const name of ['showOpenFilePicker', 'showSaveFilePicker'])
      Object.defineProperty(window, name, { value: undefined, configurable: true });
  });
}

async function downloadBySaving(page: Page, click: () => Promise<void>) {
  const [download] = await Promise.all([page.waitForEvent('download'), click()]);
  return { name: download.suggestedFilename(), path: await download.path() };
}

test.describe('start screen (ui-concept §2.1)', () => {
  test('offers a new tree, a file or the example', async ({ app, page }) => {
    await app.open();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Stammbaum');
    await expect(page.getByRole('button', { name: 'Neuen Stammbaum anlegen' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stammbaum-Datei öffnen' })).toBeVisible();
    await page.getByRole('button', { name: 'Beispiel ansehen' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Familie Brandt');
    // The untouched example has nothing to save.
    await expect(status(page)).toHaveCount(0);
  });

  test('a new tree starts with its first person (DATA-02)', async ({ app, page }) => {
    await app.open();
    await page.getByRole('button', { name: 'Neuen Stammbaum anlegen' }).click();
    await expect(dialog(page).getByRole('button', { name: 'Anlegen' })).toBeDisabled();
    await dialog(page).getByLabel('Name').fill('Familie Test');
    await dialog(page).getByRole('button', { name: 'Anlegen' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Familie Test');
    await expect(dialog(page).getByRole('heading')).toHaveText('Person eintragen');
    await dialog(page).getByLabel('Vornamen').fill('Anna');
    await dialog(page).getByRole('button', { name: 'Fertig' }).click();
    await expect(page.locator('.card')).toHaveCount(1);
    await expect(page.locator('.card')).toContainText('Anna');
    await expect(status(page)).toHaveText('● Nicht in Datei gespeichert');
  });
});

test.describe('working copy (DATA-03)', () => {
  test('edits survive a reload, and the last project opens by itself', async ({ app, page }) => {
    await app.openExample();
    await renameKarl(page, 'Carl');
    await expect.poll(() => storedName(page, 'p_karl')).toBe('Carl');
    // Not in a file yet: the browser asks before leaving (ui-concept §4).
    expect(await app.reload()).toBe(true);
    await expect(card(page, 'p_karl')).toContainText('Carl Brandt');
    await expect(status(page)).toHaveText('● Nicht in Datei gespeichert');
  });

  // E.g. "sites may not save data" or a locked-down browser: files still open and save.
  test('without the browser database, the app still works', async ({ app, page }) => {
    await withoutFilePickers(page);
    await page.addInitScript(() => {
      Object.defineProperty(window, 'indexedDB', {
        value: {
          open: () => {
            throw new DOMException('blocked', 'SecurityError');
          },
        },
      });
    });
    await app.open();
    await expect(page.getByRole('status')).toHaveText(
      'Der Browser lässt das Speichern einer Arbeitskopie nicht zu.',
    );
    await page.getByRole('button', { name: 'Beispiel ansehen' }).click();
    await renameKarl(page, 'Carl');
    const file = await downloadBySaving(page, () =>
      page.getByRole('button', { name: 'Speichern', exact: true }).click(),
    );
    await dialog(page).getByRole('button', { name: 'Verstanden' }).click();
    await menu(page, 'Beispiel ansehen');
    await expect(card(page, 'p_karl')).toContainText('Karl Heinrich Brandt');
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), menu(page, 'Öffnen …')]);
    await chooser.setFiles(file.path);
    await expect(card(page, 'p_karl')).toContainText('Carl Brandt');
  });

  test('renaming the tree is a change like any other', async ({ app, page }) => {
    await app.openExample();
    await menu(page, 'Umbenennen');
    await dialog(page).getByLabel('Name').fill('Familie Brand');
    await dialog(page).getByRole('button', { name: 'Umbenennen' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Familie Brand');
    await page.getByRole('button', { name: 'Rückgängig' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Familie Brandt');
  });
});

test.describe('saving and opening by download (DATA-04, DATA-09, UI-02)', () => {
  test.beforeEach(async ({ page }) => withoutFilePickers(page));

  test('a saved file opens again with all changes', async ({ app, page }) => {
    await app.openExample();
    await renameKarl(page, 'Carl');
    const saveButton = page.getByRole('button', { name: 'Speichern', exact: true });
    const file = await downloadBySaving(page, () => saveButton.click());
    // Playwright's WebKit turns the space into an underscore.
    expect(file.name).toMatch(/^Familie[ _]Brandt\.stammbaum$/);
    // The first download explains where the file went, only once.
    await expect(dialog(page)).toContainText('Download-Ordner');
    await dialog(page).getByRole('button', { name: 'Verstanden' }).click();
    await expect(status(page)).toHaveText('✓ Gespeichert');
    await downloadBySaving(page, () => saveButton.click());
    await expect(dialog(page)).toHaveCount(0);
    // Everything is in the file: leaving needs no question.
    expect(await app.reload()).toBe(false);

    // Something else, then the saved file again.
    await menu(page, 'Neuer Stammbaum');
    await dialog(page).getByLabel('Name').fill('Familie Test');
    await dialog(page).getByRole('button', { name: 'Anlegen' }).click();
    await dialog(page).getByRole('button', { name: 'Fertig' }).click();
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), menu(page, 'Öffnen …')]);
    await chooser.setFiles(file.path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Familie Brandt');
    await expect(card(page, 'p_karl')).toContainText('Carl Brandt');
    await expect(status(page)).toHaveText('✓ Gespeichert');
  });

  test('asks before an unsaved tree is replaced', async ({ app, page }) => {
    await app.openExample();
    await renameKarl(page, 'Carl');
    await menu(page, 'Beispiel ansehen');
    await expect(dialog(page)).toContainText(
      'Dieser Stammbaum ist noch nicht in einer Datei gespeichert.',
    );
    await dialog(page).getByRole('button', { name: 'Abbrechen' }).click();
    await expect(card(page, 'p_karl')).toContainText('Carl Brandt');

    await menu(page, 'Beispiel ansehen');
    await dialog(page).getByRole('button', { name: 'Ohne Speichern weiter' }).click();
    await expect(card(page, 'p_karl')).toContainText('Karl Heinrich Brandt');
    await expect(status(page)).toHaveCount(0);
  });

  test('"Jetzt speichern" saves first, then goes on', async ({ app, page }) => {
    await app.openExample();
    await renameKarl(page, 'Carl');
    await menu(page, 'Neuer Stammbaum');
    await downloadBySaving(page, () =>
      dialog(page).getByRole('button', { name: 'Jetzt speichern' }).click(),
    );
    await dialog(page).getByRole('button', { name: 'Verstanden' }).click();
    await expect(dialog(page).getByRole('heading')).toHaveText('Neuer Stammbaum');
  });

  test('a wrong file changes nothing', async ({ app, page }) => {
    await app.openExample();
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), menu(page, 'Öffnen …')]);
    await chooser.setFiles({
      name: 'brief.stammbaum',
      mimeType: 'text/plain',
      buffer: Buffer.from('Hallo'),
    });
    await expect(page.getByRole('status')).toHaveText('Diese Datei ist keine Stammbaum-Datei.');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Familie Brandt');
  });

  test('a file dropped onto the window opens', async ({ app, page }) => {
    await app.openExample();
    await renameKarl(page, 'Carl');
    const file = await downloadBySaving(page, () =>
      page.getByRole('button', { name: 'Speichern', exact: true }).click(),
    );
    await dialog(page).getByRole('button', { name: 'Verstanden' }).click();
    await menu(page, 'Beispiel ansehen');
    await expect(card(page, 'p_karl')).toContainText('Karl Heinrich Brandt');
    const bytes = [...(await readFile(file.path))];
    const data = await page.evaluateHandle((bytes) => {
      const transfer = new DataTransfer();
      transfer.items.add(new File([new Uint8Array(bytes)], 'Familie Brandt.stammbaum'));
      return transfer;
    }, bytes);
    await page.locator('main').dispatchEvent('drop', { dataTransfer: data });
    await expect(card(page, 'p_karl')).toContainText('Carl Brandt');
  });
});

test.describe('backup reminder (UI-02)', () => {
  test('after a week without saving into a file, a gentle reminder shows', async ({
    app,
    page,
  }) => {
    await app.openExample();
    await renameKarl(page, 'Carl');
    await expect.poll(() => storedName(page, 'p_karl')).toBe('Carl');
    // Pretend the change was made eight days ago.
    await page.evaluate(
      () =>
        new Promise<void>((resolve, reject) => {
          const open = indexedDB.open('stammbaum', 1);
          open.onsuccess = () => {
            const store = open.result.transaction('state', 'readwrite').objectStore('state');
            const get = store.get('project');
            get.onsuccess = () => {
              const since = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000 - 60_000).toISOString();
              const put = store.put({ ...get.result, file: { unsavedSince: since } }, 'project');
              put.onsuccess = () => resolve();
              put.onerror = () => reject(put.error);
            };
          };
        }),
    );
    await app.reload();
    const reminder = page.locator('.reminder');
    await expect(reminder).toContainText(
      'Dein Stammbaum ist seit 8 Tagen nicht in einer Datei gespeichert.',
    );
    await reminder.getByRole('button', { name: 'Ausblenden' }).click();
    await expect(reminder).toHaveCount(0);
  });
});

test.describe('saving into the file in Chrome and Edge (DATA-09)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'File System Access is Chromium only');

  test('after "Speichern" every change is written into the file', async ({ app, page }) => {
    // A stand-in for the real file picker, which a test can't click.
    await page.addInitScript(() => {
      const writes: Uint8Array[] = [];
      Object.assign(window, { writes });
      const handle = {
        kind: 'file',
        name: 'Brandt.stammbaum',
        queryPermission: async () => 'granted',
        requestPermission: async () => 'granted',
        createWritable: async () => {
          const parts: Uint8Array[] = [];
          return {
            write: async (data: Uint8Array) => void parts.push(new Uint8Array(data)),
            close: async () => void writes.push(...parts),
          };
        },
      };
      Object.defineProperty(window, 'showSaveFilePicker', { value: async () => handle });
    });
    const writes = () =>
      page.evaluate(() => (window as unknown as { writes: Uint8Array[] }).writes.length);
    const firstBytes = () =>
      page.evaluate(() => [
        ...(window as unknown as { writes: Uint8Array[] }).writes[0]!.slice(0, 2),
      ]);

    await app.openExample();
    await page.getByRole('button', { name: 'Speichern', exact: true }).click();
    await expect(status(page)).toHaveText('✓ Gespeichert');
    expect(await writes()).toBe(1);
    expect(await firstBytes()).toEqual([0x50, 0x4b]); // "PK": a zip file
    await expect(dialog(page)).toHaveCount(0);

    await renameKarl(page, 'Carl');
    await expect(status(page)).toHaveText('● Nicht in Datei gespeichert');
    await expect(status(page)).toHaveText('✓ Gespeichert', { timeout: 10_000 });
    expect(await writes()).toBe(2);
  });
});
