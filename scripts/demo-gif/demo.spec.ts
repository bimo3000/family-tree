import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../../tests/e2e/fixtures';

/**
 * The storyline of the README demo GIF (`npm run demo-gif`). It screenshots the page in a loop while it
 * plays, and `make-gif.py` turns the frames into `docs/assets/demo.gif`.
 */
const FRAMES_DIR = resolve(import.meta.dirname, '../../test-results/demo-frames');

/** Headless browsers draw no mouse pointer: an arrow that follows the mouse, with a ring on each click. */
function fakeCursor() {
  addEventListener('DOMContentLoaded', () => {
    const arrow = document.createElement('div');
    arrow.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 22 22"><path d="M2 1 L2 17 L6.5 13 L9.5 20 L12.5 18.8 L9.6 12 L15.5 12 Z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    Object.assign(arrow.style, {
      position: 'fixed',
      left: '-50px',
      top: '-50px',
      zIndex: '2147483647',
      pointerEvents: 'none',
    });
    document.body.append(arrow);
    addEventListener(
      'mousemove',
      (e) => Object.assign(arrow.style, { left: `${e.clientX - 2}px`, top: `${e.clientY - 1}px` }),
      true,
    );
    addEventListener(
      'mousedown',
      (e) => {
        const ring = document.createElement('div');
        Object.assign(ring.style, {
          position: 'fixed',
          left: `${e.clientX - 16}px`,
          top: `${e.clientY - 16}px`,
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'rgba(230, 120, 30, 0.35)',
          border: '2px solid rgba(230, 120, 30, 0.8)',
          zIndex: '2147483646',
          pointerEvents: 'none',
        });
        document.body.append(ring);
        setTimeout(() => ring.remove(), 350);
      },
      true,
    );
  });
}

/** Screenshots in a loop, each with the time it was taken. */
function recorder(page: Page) {
  const frames: { png: Buffer; t: number }[] = [];
  let running = true;
  const loop = (async () => {
    while (running) {
      const t = Date.now();
      frames.push({ png: await page.screenshot({ animations: 'allow' }), t });
    }
  })();
  return {
    async stop() {
      running = false;
      await loop;
      rmSync(FRAMES_DIR, { recursive: true, force: true });
      mkdirSync(FRAMES_DIR, { recursive: true });
      frames.forEach((f, i) =>
        writeFileSync(`${FRAMES_DIR}/${String(i).padStart(4, '0')}.png`, f.png),
      );
      // Each frame lasts until the next one; the last one ends the recording.
      const durations = frames.map((f, i) => (frames[i + 1]?.t ?? Date.now()) - f.t);
      writeFileSync(`${FRAMES_DIR}/durations.json`, JSON.stringify(durations));
    },
  };
}

test('demo', async ({ app, page }) => {
  await page.addInitScript(fakeCursor);
  await app.open();

  let at = { x: 550, y: 600 };
  /** Moves the mouse smoothly (ease in and out) to a point, in about `ms` milliseconds. */
  async function glide(x: number, y: number, ms = 600) {
    const from = at;
    const start = Date.now();
    for (let s = 0; s < 1;) {
      s = Math.min(1, (Date.now() - start) / ms);
      const e = s < 0.5 ? 2 * s * s : 1 - (-2 * s + 2) ** 2 / 2;
      await page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e);
      await page.waitForTimeout(15);
    }
    at = { x, y };
  }
  async function glideTo(target: Locator, ms?: number) {
    const box = await target.boundingBox();
    if (!box) throw new Error('target not visible');
    await glide(box.x + box.width / 2, box.y + box.height / 2, ms);
  }
  /** Wheels down over a scrolling box (panel, dialog) until `target` is well inside it. */
  async function scrollTo(box: Locator, target: Locator) {
    const outer = (await box.boundingBox())!;
    await glide(outer.x + outer.width / 2, outer.y + outer.height * 0.6, 500);
    for (let i = 0; i < 40; i++) {
      const inner = (await target.boundingBox())!;
      if (inner.y + inner.height < outer.y + outer.height - 30) break;
      await page.mouse.wheel(0, 40);
      await page.waitForTimeout(20);
    }
  }
  async function click() {
    await page.mouse.down();
    await page.waitForTimeout(80);
    await page.mouse.up();
  }
  const hold = (ms: number) => page.waitForTimeout(ms);
  const card = (id: string) => page.locator(`.card[data-id="${id}"]`);
  const panel = page.getByRole('complementary', { name: 'Details' });
  const dialog = page.getByRole('dialog');

  await page.mouse.move(at.x, at.y);
  await expect(page.getByRole('button', { name: 'See an example' })).toBeVisible();
  const rec = recorder(page);
  try {
    // 1. Start screen → the example.
    await hold(800);
    await glideTo(page.getByRole('button', { name: 'See an example' }), 800);
    await click();
    await expect(card('p_karl')).toBeVisible();
    await hold(1300);

    // 2. Hover: full dates in the tooltip.
    await glideTo(card('p_karl'), 700);
    await expect(page.getByRole('tooltip')).toBeVisible();
    await hold(1400);

    // 3. Select Thomas: his line lights up, the panel opens.
    await glideTo(card('p_thomas'), 700);
    await click();
    await expect(panel).toBeVisible();
    await hold(1500);

    // 4. Add a third child to Thomas and Julia.
    const addChild = panel.getByRole('button', { name: '+ Child', exact: true });
    await scrollTo(panel, addChild);
    await hold(300);
    await glideTo(addChild, 500);
    await click();
    await expect(dialog).toBeVisible();
    await hold(900);
    await glideTo(dialog.getByRole('button', { name: 'Add', exact: true }), 500);
    await click();
    await expect(dialog.getByLabel('Given names')).toBeFocused();
    await hold(400);
    await page.keyboard.type('Emma', { delay: 150 });
    await hold(400);
    const done = dialog.getByRole('button', { name: 'Done' });
    await scrollTo(dialog, done);
    await glideTo(done, 500);
    await click();
    await expect(page.locator('.card')).toHaveCount(22);
    await hold(1600);

    // 5. Zoom in with the wheel, pan, then show everything again.
    await glideTo(page.locator('.card', { hasText: 'Emma' }), 600);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, -50);
      await page.waitForTimeout(40);
    }
    await hold(700);
    const viewport = (await page.locator('.viewport').boundingBox())!;
    await glide(viewport.x + 60, viewport.y + viewport.height - 80, 500);
    await page.mouse.down();
    await glide(viewport.x + 360, viewport.y + viewport.height - 200, 800);
    await page.mouse.up();
    await hold(400);
    await glideTo(page.getByRole('button', { name: '⤢ Show all' }), 700);
    await click();
    await hold(1600);
  } finally {
    await rec.stop();
  }
});
