import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

/** The world layer's transform as numbers: translate(x, y) scale(k). */
async function view(page: Page) {
  const style = (await page.getByTestId('world').getAttribute('style')) ?? '';
  const [x, y, k] = (style.match(/-?[\d.]+(?:e-?\d+)?/g) ?? []).map(Number);
  return { x: x ?? NaN, y: y ?? NaN, k: k ?? NaN };
}

const card = (page: Page, id: string) => page.locator(`.card[data-id="${id}"]`);
type Finger = [number, number];
/** Two fingers on a touch screen (TREE-06). Playwright has no multi-touch, so this sends the pointer events itself. */
async function pinch(page: Page, from: [Finger, Finger], to: [Finger, Finger]) {
  await page.evaluate(
    ({ from, to }) => {
      const fire = (type: string, id: number, [x, y]: [number, number]) =>
        (document.elementFromPoint(x, y) ?? document.body).dispatchEvent(
          new PointerEvent(type, {
            pointerId: id,
            pointerType: 'touch',
            isPrimary: id === 1,
            clientX: x,
            clientY: y,
            button: type === 'pointermove' ? -1 : 0,
            buttons: type === 'pointerup' ? 0 : 1,
            bubbles: true,
          }),
        );
      const at = (a: [number, number], b: [number, number], t: number): [number, number] => [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
      ];
      fire('pointerdown', 1, from[0]);
      fire('pointerdown', 2, from[1]);
      for (let i = 1; i <= 5; i++) {
        fire('pointermove', 1, at(from[0], to[0], i / 5));
        fire('pointermove', 2, at(from[1], to[1], i / 5));
      }
      fire('pointerup', 1, to[0]);
      fire('pointerup', 2, to[1]);
    },
    { from, to },
  );
}

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
    await expect(card(page, 'p_heinrich')).toContainText('* ~1890 † 1962');
    // Years only, even where the full date would fit (D-001, user).
    await expect(card(page, 'p_margarete')).toContainText('* 1894 † 1971');
    await expect(card(page, 'p_margarete')).not.toContainText('02.06.1894');
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

test.describe('long names on a card (PERS-04)', () => {
  async function rename(page: Page, id: string, given: string, surname: string) {
    await card(page, id).click();
    await panel(page).getByRole('button', { name: 'Bearbeiten', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Vornamen').fill(given);
    await dialog.getByLabel('Nachname (zuletzt bekannt)').fill(surname);
    await dialog.getByRole('button', { name: 'Fertig' }).click();
    await expect(dialog).toBeHidden();
  }

  /** What the card's name shows and whether it fits: within two lines, inside the card, letters not cut off. */
  function nameBox(page: Page, id: string) {
    return card(page, id).evaluate((c) => {
      const nm = c.querySelector<HTMLElement>('.nm')!;
      const yr = c.querySelector<HTMLElement>('.yr')!;
      const cs = getComputedStyle(nm);
      const size = parseFloat(cs.fontSize);
      const box = c.getBoundingClientRect();
      return {
        text: nm.textContent,
        scale: size / parseFloat(getComputedStyle(c).fontSize),
        fits:
          nm.scrollHeight < nm.clientHeight + parseFloat(cs.lineHeight) / 2 &&
          nm.scrollWidth <= nm.clientWidth + 1,
        lineHeight: parseFloat(cs.lineHeight) / size,
        inside: yr.getBoundingClientRect().bottom <= box.bottom,
      };
    });
  }

  test('a short name stays as it is', async ({ page }) => {
    const box = await nameBox(page, 'p_karl');
    expect(box).toMatchObject({ text: 'Karl Heinrich Brandt', scale: 1, fits: true, inside: true });
    // Room for letters below the line ("g"), they were cut off with 1.2.
    expect(box.lineHeight).toBeCloseTo(1.3, 2);
  });

  test('drops further given names first, then shrinks, and keeps the surname', async ({ page }) => {
    await rename(page, 'p_karl', 'Monique Véronique', 'Lindemann');
    await expect(card(page, 'p_karl').locator('.nm')).toHaveText('Monique Lindemann');
    expect(await nameBox(page, 'p_karl')).toMatchObject({ scale: 1, fits: true, inside: true });
    // The full name stays in the tooltip and for screen readers.
    await expect(card(page, 'p_karl')).toHaveAttribute('aria-label', 'Monique Véronique Lindemann');

    await rename(page, 'p_karl', 'Elena', 'Champeroux-Lindemann');
    await expect(card(page, 'p_karl').locator('.nm')).toHaveText('Elena Champeroux-Lindemann');
    const box = await nameBox(page, 'p_karl');
    expect(box).toMatchObject({ fits: true, inside: true });
    expect(box.scale).toBeLessThan(1);
    expect(box.scale).toBeGreaterThanOrEqual(0.7);

    // Shorter again: back to the normal size.
    await rename(page, 'p_karl', 'Karl', 'Brandt');
    expect(await nameBox(page, 'p_karl')).toMatchObject({ text: 'Karl Brandt', scale: 1 });
  });
});

test('a long year line gets smaller instead of being cut off (PERS-04)', async ({ page }) => {
  await card(page, 'p_karl').click();
  await panel(page).getByRole('button', { name: 'Bearbeiten', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Geboren am').fill('zw. 1890 und 1895');
  await dialog.getByLabel('Gestorben am').fill('zw. 1920 und 1925');
  await dialog.getByRole('button', { name: 'Fertig' }).click();
  const yr = card(page, 'p_karl').locator('.yr');
  await expect(yr).toHaveText('* 1890/1895\u2002† 1920/1925');
  expect(await yr.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
});

test('a short year line keeps its full size (PERS-04)', async ({ page }) => {
  // The fit check once read `line-height: normal` as NaN, so every year line shrank to the minimum.
  const scale = await card(page, 'p_karl')
    .locator('.yr')
    .evaluate(
      (el) =>
        parseFloat(getComputedStyle(el).fontSize) /
        parseFloat(getComputedStyle(document.documentElement).fontSize),
    );
  expect(scale).toBeCloseTo(0.9, 2); // 0.9rem in PersonCard.svelte
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

  test('the highlight runs from a descendant through the couple line to the child', async ({
    page,
  }) => {
    // Karl selected: Peter is his son, Peter's former wife Sabine is not in Karl's line, their children are.
    await card(page, 'p_karl').click();
    await expect(card(page, 'p_sabine')).toHaveClass(/dim/);
    await expect(page.getByTestId('half-couple').first()).toBeAttached();
    // Peter selected: his couple line with Sabine is lit in full, no half lines.
    await card(page, 'p_peter').click();
    await expect(page.getByTestId('half-couple')).toHaveCount(0);
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

  test('two fingers spread apart zoom in, around the middle between them (TREE-06)', async ({
    page,
  }) => {
    const start = await view(page);
    await pinch(
      page,
      [
        [380, 300],
        [420, 300],
      ],
      [
        [360, 300],
        [440, 300],
      ],
    );
    const zoomed = await view(page);
    expect(zoomed.k).toBeCloseTo(start.k * 2);
    // The drawing point between the fingers is still there.
    const box = (await page.locator('.viewport').boundingBox())!;
    const mid = 400 - box.x;
    expect((mid - zoomed.x) / zoomed.k).toBeCloseTo((mid - start.x) / start.k);
    await expect(panel(page)).toBeHidden();
  });

  test('two fingers pinched together zoom out (TREE-06)', async ({ page }) => {
    const fitted = await view(page);
    await page.getByRole('button', { name: '+' }).click();
    await expect.poll(async () => (await view(page)).k).toBeCloseTo(fitted.k * 1.25);
    const start = await view(page);
    await pinch(
      page,
      [
        [300, 300],
        [500, 300],
      ],
      [
        [350, 300],
        [450, 300],
      ],
    );
    expect((await view(page)).k).toBeCloseTo(start.k / 2);
  });

  test('a name in the panel centres that person, next to the open panel', async ({ page }) => {
    await card(page, 'p_peter').click();
    await panel(page)
      .getByRole('button', { name: /^Karl Brandt/ })
      .click();
    await expect
      .poll(async () => {
        const viewport = await page.locator('.viewport').boundingBox();
        const box = await card(page, 'p_karl').boundingBox();
        return box && viewport
          ? Math.abs(box.x + box.width / 2 - viewport.x - viewport.width / 2)
          : 999;
      })
      .toBeLessThan(5);
  });
});
