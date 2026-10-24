import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

/** The world layer's transform as numbers: translate(x, y) scale(k). */
async function view(page: Page) {
  const style = (await page.getByTestId('world').getAttribute('style')) ?? '';
  const [x, y, k] = (style.match(/-?[\d.]+(?:e-?\d+)?/g) ?? []).map(Number);
  return { x: x ?? NaN, y: y ?? NaN, k: k ?? NaN };
}

const card = (page: Page, id: string) => page.locator(`.card[data-id="${id}"]`);
const panel = (page: Page) => page.getByRole('complementary', { name: 'Details' });

test.beforeEach(async ({ app }) => {
  await app.openExample();
});

test.describe('tree view (TREE-02, PERS-04)', () => {
  test('shows the example family with one card per person', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Familie Brandt');
    await expect(page.locator('.card')).toHaveCount(21);
    await expect(card(page, 'p_karl')).toContainText('Karl Heinrich Brandt');
    await expect(card(page, 'p_karl')).toContainText('* 1921 † 1999');
    await expect(card(page, 'p_heinrich')).toContainText('* ca. 1890 † 1962');
    await expect(card(page, 'p_unbekannt')).toHaveText('?');
  });

  test('draws special relations only where they exist (TREE-03/04)', async ({ page }) => {
    await expect(page.locator('.edges title', { hasText: 'geschieden' })).toHaveCount(1);
    // Jonas has two adoptive parents: one dashed line with its own label.
    await expect(page.locator('.edges path.dashed').first()).toBeAttached();
    await expect(page.locator('.edges path.dashed title').first()).toHaveText('Adoptivkind');
  });

  test('shows full dates on hover (PERS-04/05)', async ({ page }) => {
    await card(page, 'p_karl').hover();
    const tip = page.getByRole('tooltip');
    await expect(tip).toContainText('Karl Heinrich Brandt');
    await expect(tip).toContainText('* 12.03.1921 in Lübeck');
    await page.mouse.move(5, 5);
    await expect(tip).toBeHidden();
  });
});

test.describe('selection and detail panel (PERS-05, PERS-07)', () => {
  test('selecting a person highlights their line and opens the panel', async ({ page }) => {
    await card(page, 'p_peter').click();
    await expect(card(page, 'p_peter')).toHaveClass(/selected/);
    await expect(card(page, 'p_karl')).not.toHaveClass(/dim/);
    await expect(card(page, 'p_frieda')).toHaveClass(/dim/);
    await expect(page.locator('.edges path.hl').first()).toBeAttached();

    const details = panel(page);
    await expect(details.getByRole('heading', { level: 2 })).toHaveText('Peter Brandt');
    await expect(details).toContainText('05.10.1948 in Lübeck');
    await expect(details).toContainText('Vater');
    await expect(details).toContainText('verheiratet 1973, geschieden 1985');
    await expect(details).toContainText('Halbbruder');
  });

  test('a name in the panel jumps to that person', async ({ page }) => {
    await card(page, 'p_peter').click();
    await panel(page)
      .getByRole('button', { name: /^Karl Brandt/ })
      .click();
    await expect(panel(page).getByRole('heading', { level: 2 })).toHaveText('Karl Heinrich Brandt');
    await expect(panel(page)).toContainText('Partner/innen');
    await expect(card(page, 'p_karl')).toHaveClass(/selected/);
  });

  test('adoptive parents and unknown parents are named as such', async ({ page }) => {
    await card(page, 'p_jonas').click();
    await expect(panel(page)).toContainText('Adoptivmutter');
    await card(page, 'p_unbekannt').click();
    await expect(panel(page).getByRole('heading', { level: 2 })).toHaveText(
      'Unbekannter Elternteil',
    );
  });

  test('Esc, the close button and a click on the background clear the selection', async ({
    page,
  }) => {
    await card(page, 'p_peter').click();
    await page.keyboard.press('Escape');
    await expect(panel(page)).toBeHidden();
    await expect(page.locator('.card.dim')).toHaveCount(0);

    await card(page, 'p_peter').click();
    await panel(page).getByRole('button', { name: '×' }).click();
    await expect(panel(page)).toBeHidden();

    await card(page, 'p_peter').click();
    await page.mouse.click(10, 100);
    await expect(panel(page)).toBeHidden();
  });
});

test.describe('pan and zoom (TREE-02)', () => {
  test('zoom buttons zoom, "Alles anzeigen" fits the tree again', async ({ page }) => {
    const start = await view(page);
    await page.getByRole('button', { name: '+' }).click();
    await expect.poll(async () => (await view(page)).k).toBeGreaterThan(start.k);
    await page.getByRole('button', { name: '−' }).click();
    await page.getByRole('button', { name: '−' }).click();
    await expect.poll(async () => (await view(page)).k).toBeLessThan(start.k);
    await page.getByRole('button', { name: 'Alles anzeigen' }).click();
    await expect.poll(async () => (await view(page)).k).toBeCloseTo(start.k);
  });

  test('dragging the background pans, without selecting anything', async ({ page }) => {
    const start = await view(page);
    await page.mouse.move(20, 120);
    await page.mouse.down();
    await page.mouse.move(120, 170, { steps: 5 });
    await page.mouse.up();
    const moved = await view(page);
    expect(moved.x - start.x).toBeCloseTo(100);
    expect(moved.y - start.y).toBeCloseTo(50);
    await expect(panel(page)).toBeHidden();
  });

  test('the mouse wheel zooms', async ({ page }) => {
    const start = await view(page);
    await page.mouse.move(400, 300);
    await page.mouse.wheel(0, -300);
    await expect.poll(async () => (await view(page)).k).toBeGreaterThan(start.k);
  });

  test('double-click centres a person, also next to the open panel', async ({ page }) => {
    await card(page, 'p_jonas').dblclick();
    await expect(panel(page)).toBeVisible();
    await expect
      .poll(async () => {
        const viewport = await page.locator('.viewport').boundingBox();
        const box = await card(page, 'p_jonas').boundingBox();
        return box && viewport
          ? Math.abs(box.x + box.width / 2 - viewport.x - viewport.width / 2)
          : 999;
      })
      .toBeLessThan(5);
  });
});
