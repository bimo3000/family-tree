import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const card = (page: Page, id: string) => page.locator(`.card[data-id="${id}"]`);
const panel = (page: Page) => page.getByRole('complementary', { name: 'Details' });
const dialog = (page: Page) => page.getByRole('dialog');
const undo = (page: Page) => page.getByRole('button', { name: 'Rückgängig' });
const redo = (page: Page) => page.getByRole('button', { name: 'Wiederholen' });

async function open(page: Page, id: string, button: string) {
  await card(page, id).click();
  await panel(page).getByRole('button', { name: button, exact: true }).click();
  await expect(dialog(page)).toBeVisible();
}

test.beforeEach(async ({ app }) => {
  await app.openExample();
});

test.describe('editing a person (PERS-01, PERS-06, UI-01)', () => {
  test('changes apply at once and can be undone and redone', async ({ page }) => {
    await expect(undo(page)).toBeDisabled();
    await open(page, 'p_karl', 'Bearbeiten');
    await expect(dialog(page).getByRole('heading')).toHaveText('Person bearbeiten');
    await dialog(page).getByLabel('Vornamen').fill('Carl');
    await expect(card(page, 'p_karl')).toContainText('Carl Brandt');

    await dialog(page).getByLabel('Geboren am').fill('um 1920');
    await expect(dialog(page)).toContainText('→ ungefähr 1920');
    await dialog(page).getByLabel('Gestorben am').fill('Ostern 1999');
    await expect(dialog(page)).toContainText('→ wird so übernommen');
    await expect(card(page, 'p_karl')).toContainText('* ~1920 † Ostern 1999');

    await dialog(page).getByRole('button', { name: 'Fertig' }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(panel(page).getByRole('heading', { level: 2 })).toHaveText('Carl Brandt');

    // One undo step per field.
    await undo(page).click();
    await expect(card(page, 'p_karl')).toContainText('* ~1920 † 1999');
    await undo(page).click();
    await undo(page).click();
    await expect(card(page, 'p_karl')).toContainText('Karl Heinrich Brandt');
    await expect(card(page, 'p_karl')).toContainText('* 1921 † 1999');
    await expect(undo(page)).toBeDisabled();

    await page.keyboard.press('Control+y');
    await expect(card(page, 'p_karl')).toContainText('Carl Brandt');
    await page.keyboard.press('Control+z');
    await expect(card(page, 'p_karl')).toContainText('Karl Heinrich Brandt');
    await redo(page).click();
    await expect(card(page, 'p_karl')).toContainText('Carl Brandt');
  });

  test('undo while the dialog is open shows the restored values', async ({ page }) => {
    await open(page, 'p_peter', 'Bearbeiten');
    await dialog(page).getByLabel('Vornamen').fill('Pit');
    await expect(card(page, 'p_peter')).toContainText('Pit Brandt');
    // Outside a text field, Ctrl+Z is the app's undo (inside one it belongs to the field).
    await dialog(page).getByLabel('verstorben, Datum unbekannt').focus();
    await page.keyboard.press('Control+z');
    await expect(dialog(page).getByLabel('Vornamen')).toHaveValue('Peter');
    await expect(card(page, 'p_peter')).toContainText('Peter Brandt');
    // Esc closes the dialog but keeps the person selected.
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await expect(panel(page)).toBeVisible();
  });
});

test.describe('Enter presses the highlighted button', () => {
  test('in the person dialog: „Fertig“', async ({ page }) => {
    await open(page, 'p_karl', 'Bearbeiten');
    await dialog(page).getByLabel('Vornamen').fill('Carl');
    await dialog(page).getByLabel('Vornamen').press('Enter');
    await expect(dialog(page)).toBeHidden();
    await expect(card(page, 'p_karl')).toContainText('Carl Brandt');
  });

  test('in „+ Kind“: „Hinzufügen“, then „Fertig“ in the new person', async ({ page }) => {
    await open(page, 'p_thomas', '+ Kind');
    // No text field here: the focus is on the first choice.
    await page.keyboard.press('Enter');
    await expect(dialog(page).getByRole('heading')).toHaveText('Person eintragen');
    await page.keyboard.type('Paul');
    await page.keyboard.press('Enter');
    await expect(dialog(page)).toBeHidden();
    await expect(page.locator('.card')).toHaveCount(22);
    await expect(panel(page).getByRole('heading', { level: 2 })).toHaveText('Paul');
  });

  test('in „Lebensgeschichte“ Enter starts a new line', async ({ page }) => {
    await open(page, 'p_karl', 'Bearbeiten');
    const bio = dialog(page).getByLabel('Lebensgeschichte');
    if (!(await bio.isVisible())) await dialog(page).getByText('Mehr Angaben').click();
    await bio.fill('Erste Zeile');
    await bio.press('Enter');
    await bio.pressSequentially('Zweite Zeile');
    await expect(dialog(page)).toBeVisible();
    await expect(bio).toHaveValue('Erste Zeile\nZweite Zeile');
  });
});

test('a double-click on a card opens the person for editing', async ({ page }) => {
  await card(page, 'p_karl').dblclick();
  await expect(dialog(page).getByRole('heading')).toHaveText('Person bearbeiten');
  await expect(dialog(page).getByLabel('Vornamen')).toHaveValue('Karl Heinrich');
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  await expect(panel(page).getByRole('heading', { level: 2 })).toHaveText('Karl Heinrich Brandt');
});

test('the gender chosen under "Mehr Angaben" sets the wording (PERS-07)', async ({ page }) => {
  await card(page, 'p_mia').click();
  await expect(panel(page)).not.toContainText('Schwester');
  await open(page, 'p_kim', 'Bearbeiten');
  await dialog(page).getByText('Mehr Angaben').click();
  await dialog(page).getByLabel('Geschlecht').selectOption('female');
  await dialog(page).getByRole('button', { name: 'Fertig' }).click();
  await panel(page)
    .getByRole('button', { name: /^Mia Brandt/ })
    .click();
  await expect(panel(page)).toContainText('Schwester');
});

test.describe('adding relatives (ui-concept §2.6)', () => {
  test('a second parent becomes the partner of the first, without asking', async ({ page }) => {
    const addPerson = async (button: string, name: string) => {
      await panel(page).getByRole('button', { name: button, exact: true }).click();
      await dialog(page).getByRole('button', { name: 'Hinzufügen' }).click();
      await dialog(page).getByLabel('Vornamen').fill(name);
      await dialog(page).getByRole('button', { name: 'Fertig' }).click();
    };
    await page.getByRole('heading', { level: 1 }).getByRole('button').click();
    await page.locator('.menu').getByRole('button', { name: 'Neuer Stammbaum' }).click();
    await dialog(page).getByLabel('Name').fill('Familie Test');
    await dialog(page).getByRole('button', { name: 'Anlegen' }).click();
    await dialog(page).getByLabel('Vornamen').fill('Anna');
    await dialog(page).getByRole('button', { name: 'Fertig' }).click();
    await addPerson('+ Elternteil', 'Maria');

    await page.locator('.card', { hasText: 'Anna' }).click();
    await panel(page).getByRole('button', { name: '+ Elternteil', exact: true }).click();
    await expect(dialog(page).getByRole('checkbox')).toHaveCount(0);
    await expect(dialog(page)).toContainText('wird als Partner/in von Maria eingetragen');
    await dialog(page).getByRole('button', { name: 'Abbrechen' }).click();
    await addPerson('+ Elternteil', 'Josef');
    await expect(panel(page)).toContainText(/Partner\/in\s*Maria/);
  });

  test('+ Kind adds a child of the couple and opens the new person', async ({ page }) => {
    await open(page, 'p_thomas', '+ Kind');
    await expect(dialog(page)).toContainText(
      'Das Kind wird auch als Kind von Julia Roth eingetragen.',
    );
    await dialog(page).getByRole('button', { name: 'Hinzufügen' }).click();
    await expect(dialog(page).getByRole('heading')).toHaveText('Person eintragen');
    await dialog(page).getByLabel('Vornamen').fill('Paul');
    await dialog(page).getByRole('button', { name: 'Fertig' }).click();
    await expect(page.locator('.card')).toHaveCount(22);
    await expect(panel(page).getByRole('heading', { level: 2 })).toHaveText('Paul');
    await expect(panel(page)).toContainText('Thomas Brandt');
    await expect(panel(page)).toContainText('Julia Roth');
  });

  test('"Mehr Angaben" stays open while typing (regression)', async ({ page }) => {
    await open(page, 'p_thomas', '+ Kind');
    await dialog(page).getByRole('button', { name: 'Hinzufügen' }).click();
    const more = dialog(page).locator('details');
    await dialog(page).getByText('Mehr Angaben').click();
    await expect(more).toHaveJSProperty('open', true);
    await dialog(page).getByLabel('Beruf').pressSequentially('Bäcker');
    await dialog(page).getByLabel('Vornamen').pressSequentially('P');
    await expect(more).toHaveJSProperty('open', true);
    await expect(dialog(page).getByLabel('Beruf')).toHaveValue('Bäcker');
  });

  test('a new relative left empty is not added', async ({ page }) => {
    await open(page, 'p_frieda', '+ Partner/in');
    await dialog(page).getByRole('button', { name: 'Hinzufügen' }).click();
    await expect(page.locator('.card')).toHaveCount(22);
    await dialog(page).getByRole('button', { name: 'Fertig' }).click();
    await expect(page.locator('.card')).toHaveCount(21);
    // Nothing to undo from it: ↶ must not bring the empty person back.
    await expect(page.getByRole('button', { name: 'Rückgängig' })).toBeDisabled();
  });

  test('"Mit wem?" appears for a person with several partners', async ({ page }) => {
    await open(page, 'p_karl', '+ Kind');
    await dialog(page).getByLabel('Erna Brandt').check();
    await dialog(page).getByRole('button', { name: 'Hinzufügen' }).click();
    await dialog(page).getByLabel('Vornamen').fill('Otto');
    await dialog(page).getByRole('button', { name: 'Fertig' }).click();
    await expect(panel(page)).toContainText('Karl Brandt');
    await expect(panel(page)).toContainText('Erna Brandt');
    await expect(panel(page)).not.toContainText('Hildegard');
  });

  test('+ Partner/in links an existing person', async ({ page }) => {
    await open(page, 'p_frieda', '+ Partner/in');
    await dialog(page).getByLabel('Vorhandene Person auswählen').check();
    await dialog(page).getByLabel('Vorhandene Person', { exact: true }).selectOption('p_stefan');
    await dialog(page).getByRole('button', { name: 'Hinzufügen' }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(panel(page).getByRole('heading', { level: 2 })).toHaveText('Stefan Seidel');
    await expect(panel(page)).toContainText('Frieda Brandt');
    await expect(page.locator('.card')).toHaveCount(21);
  });

  test('+ Geschwister without parents creates an unknown parent', async ({ page }) => {
    await expect(page.locator('.card.unknown')).toHaveCount(1);
    await open(page, 'p_julia', '+ Geschwister');
    await expect(dialog(page)).toContainText('Die Eltern sind noch unbekannt.');
    await dialog(page).getByRole('button', { name: 'Hinzufügen' }).click();
    await dialog(page).getByLabel('Vornamen').fill('Lisa');
    await dialog(page).getByLabel('Nachname (zuletzt bekannt)').fill('Roth');
    await dialog(page).getByRole('button', { name: 'Fertig' }).click();
    await expect(page.locator('.card.unknown')).toHaveCount(2);
    await expect(panel(page)).toContainText('Julia Roth');
  });

  test('a loop is refused with a German message', async ({ page }) => {
    await open(page, 'p_peter', '+ Kind');
    await dialog(page).getByLabel('Vorhandene Person auswählen').check();
    await dialog(page).getByLabel('Vorhandene Person', { exact: true }).selectOption('p_karl');
    await expect(dialog(page)).toContainText('Karl Brandt hat schon leibliche Eltern.');
    await dialog(page).getByRole('button', { name: 'Hinzufügen' }).click();
    await expect(dialog(page).getByRole('alert')).toContainText('eigener Vorfahr');
    await dialog(page).getByRole('button', { name: 'Abbrechen' }).click();
    await expect(undo(page)).toBeDisabled();
  });
});

test.describe('deleting and relations (ui-concept §2.7, §2.8, TREE-03)', () => {
  test('deleting asks first and can be undone', async ({ page }) => {
    await card(page, 'p_felix').click();
    await panel(page).getByRole('button', { name: 'Person löschen' }).click();
    await expect(dialog(page)).toContainText('Felix Brandt wirklich löschen?');
    await expect(dialog(page)).toContainText('Seine Verbindungen');
    await dialog(page).getByRole('button', { name: 'Löschen' }).click();
    await expect(card(page, 'p_felix')).toHaveCount(0);
    await expect(panel(page)).toBeHidden();
    await expect(page.getByRole('status')).toContainText('Gelöscht.');
    await undo(page).click();
    await expect(card(page, 'p_felix')).toHaveCount(1);
  });

  test('a partnership can be marked as divorced', async ({ page }) => {
    await expect(page.locator('.edges title', { hasText: 'geschieden' })).toHaveCount(1);
    await card(page, 'p_thomas').click();
    await panel(page).getByRole('button', { name: 'Beziehung zu Julia Roth bearbeiten' }).click();
    await dialog(page).getByLabel('Ehe').check();
    await dialog(page).getByLabel('geschieden').check();
    await dialog(page).getByLabel('Seit wann?').fill('2015');
    await dialog(page).getByRole('button', { name: 'Fertig' }).click();
    await expect(page.locator('.edges title', { hasText: 'geschieden' })).toHaveCount(2);
    await expect(panel(page)).toContainText('geschieden 2015');
  });

  test('a parent link can become an adoption', async ({ page }) => {
    await card(page, 'p_mia').click();
    await panel(page).getByRole('button', { name: 'Beziehung zu Julia Roth bearbeiten' }).click();
    await dialog(page).getByLabel('Adoptivkind').check();
    await dialog(page).getByRole('button', { name: 'Fertig' }).click();
    await expect(panel(page)).toContainText('Adoptivmutter');
  });

  test('removing the last connection offers to delete the person', async ({ page }) => {
    await card(page, 'p_stefan').click();
    await panel(page).getByRole('button', { name: 'Verbindung zu unbekannt entfernen' }).click();
    await expect(dialog(page)).toContainText('zum unbekannten Elternteil wird entfernt');
    await expect(dialog(page)).toContainText('Danach hat Stefan Seidel keine Verbindung mehr');
    await dialog(page).getByRole('button', { name: 'Stefan Seidel ganz löschen' }).click();
    await expect(card(page, 'p_stefan')).toHaveCount(0);
    await expect(card(page, 'p_unbekannt')).toHaveCount(1);
    await undo(page).click();
    await expect(card(page, 'p_stefan')).toHaveCount(1);
  });
});
