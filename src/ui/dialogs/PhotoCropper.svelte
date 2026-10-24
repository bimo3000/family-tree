<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import {
    type Crop,
    MAX_ZOOM,
    initialCrop,
    moveCrop,
    placement,
    zoomCrop,
  } from '../../core/photoCrop';

  interface Props {
    file: File;
    /** The chosen part, in pixels of the original picture (PERS-08). */
    onconfirm: (crop: Crop) => void;
    oncancel: () => void;
    /** The browser can't show the picture, e.g. an iPhone HEIC photo outside Safari. */
    onunreadable: () => void;
  }
  let { file, onconfirm, oncancel, onunreadable }: Props = $props();

  // The frame here and the preview have the card's photo shape (7:5); the preview has the card's size.
  const BOX = { width: 420, height: 300 };
  const PREVIEW = { width: 138, height: 100 };
  const KEY_STEP = 10;

  const url = URL.createObjectURL(untrack(() => file));
  onDestroy(() => URL.revokeObjectURL(url));

  let size = $state<{ width: number; height: number }>();
  let crop = $state<Crop>();
  let zoom = $state(1);
  let dragFrom: { x: number; y: number } | undefined;

  function loaded(img: HTMLImageElement) {
    const { naturalWidth: width, naturalHeight: height } = img;
    size = { width, height };
    crop = initialCrop(width, height);
  }

  function move(dx: number, dy: number) {
    if (crop && size) crop = moveCrop(crop, size.width, size.height, dx, dy, BOX.width);
  }

  function style(boxWidth: number) {
    if (!crop || !size) return 'visibility: hidden';
    const p = placement(crop, size.width, size.height, boxWidth);
    return `width: ${p.width}px; height: ${p.height}px; left: ${p.left}px; top: ${p.top}px`;
  }
</script>

<h2>Ausschnitt wählen</h2>
<p class="muted">
  Verschiebe das Foto mit der Maus und stelle die Größe ein. Gespeichert wird nur dieser Ausschnitt.
</p>
<div class="crop">
  <!-- A button, so the photo can also be moved with the arrow keys. -->
  <button
    type="button"
    class="frame"
    style:width="{BOX.width}px"
    style:height="{BOX.height}px"
    aria-label="Foto verschieben"
    onpointerdown={(e) => {
      dragFrom = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    }}
    onpointermove={(e) => {
      if (!dragFrom) return;
      move(e.clientX - dragFrom.x, e.clientY - dragFrom.y);
      dragFrom = { x: e.clientX, y: e.clientY };
    }}
    onpointerup={() => (dragFrom = undefined)}
    onpointercancel={() => (dragFrom = undefined)}
    onkeydown={(e) => {
      // Like dragging: the photo moves in the direction of the arrow.
      const step = {
        ArrowLeft: [-KEY_STEP, 0],
        ArrowRight: [KEY_STEP, 0],
        ArrowUp: [0, -KEY_STEP],
        ArrowDown: [0, KEY_STEP],
      }[e.key];
      if (!step) return;
      e.preventDefault();
      move(step[0]!, step[1]!);
    }}
  >
    <img
      src={url}
      alt=""
      draggable="false"
      style={style(BOX.width)}
      onload={(e) => loaded(e.currentTarget as HTMLImageElement)}
      onerror={onunreadable}
    />
  </button>
  <div class="side">
    <div class="muted small">So sieht es aus:</div>
    <div class="frame preview" style:width="{PREVIEW.width}px" style:height="{PREVIEW.height}px">
      <img src={url} alt="" style={style(PREVIEW.width)} />
    </div>
  </div>
</div>
<label class="zoom">
  Größe
  <input
    type="range"
    min="1"
    max={MAX_ZOOM}
    step="0.01"
    value={zoom}
    disabled={!crop}
    oninput={(e) => {
      zoom = Number(e.currentTarget.value);
      if (crop && size) crop = zoomCrop(crop, size.width, size.height, zoom);
    }}
  />
</label>
<div class="form-actions">
  <button
    type="button"
    class="btn primary"
    disabled={!crop}
    onclick={() => crop && onconfirm($state.snapshot(crop))}>Übernehmen</button
  >
  <button type="button" class="btn" onclick={oncancel}>Abbrechen</button>
</div>

<style>
  .crop {
    display: flex;
    gap: 22px;
    margin-top: 14px;
  }
  .frame {
    position: relative;
    flex: none;
    padding: 0;
    border: none;
    border-radius: calc(var(--radius) - 4px);
    overflow: hidden;
    background: var(--ph-bg);
  }
  button.frame {
    cursor: grab;
    touch-action: none;
  }
  button.frame:active {
    cursor: grabbing;
  }
  button.frame:focus-visible {
    outline: 3px solid var(--selected);
  }
  .frame img {
    position: absolute;
    max-width: none;
    user-select: none;
    pointer-events: none;
  }
  .preview {
    margin-top: 6px;
  }
  .zoom {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 14px;
  }
  .zoom input {
    width: 280px;
    accent-color: var(--accent);
  }
</style>
