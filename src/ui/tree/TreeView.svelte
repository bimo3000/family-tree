<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { computeLayout, type Point } from '../../core/layout';
  import { findPerson, focusSet } from '../../core/model/queries';
  import type { Person, PersonId, Project } from '../../core/model/types';
  import { endWord, kindLabel, tooltipLines } from '../text';
  import { centerOn, endMarkD, fitView, highlight, isOnScreen, pathD, zoomAt } from './geometry';
  import PersonCard from './PersonCard.svelte';

  interface Props {
    project: Project;
    selectedId: PersonId | null;
    onselect: (id: PersonId | null) => void;
  }
  let { project, selectedId, onselect }: Props = $props();

  const layout = $derived(computeLayout(project));
  const boxes = $derived(new Map(layout.cards.map((c) => [c.id, c])));
  const focus = $derived(selectedId ? focusSet(project, selectedId) : null);
  const hl = $derived(focus ? highlight(project, layout, focus) : null);

  let viewport: HTMLDivElement;
  let view = $state({ x: 0, y: 0, k: 1 });
  /** Smooth movement for buttons, centring and fitting; none while dragging or zooming with the wheel. */
  let animate = $state(false);

  /** Read from the element each time: the panel opening or closing changes it without a re-render here. */
  const size = () => ({ width: viewport.clientWidth, height: viewport.clientHeight });
  function setView(next: typeof view, smooth: boolean) {
    animate = smooth;
    view = next;
  }

  export function fitAll(smooth = true) {
    setView(fitView(layout, size()), smooth);
  }

  export function centre(id: PersonId) {
    const box = boxes.get(id);
    if (box) setView(centerOn(view, box, size()), true);
  }

  // Show the whole tree on start.
  $effect(() => {
    untrack(() => fitAll(false));
  });

  // The panel opening makes the viewport narrower: bring the selected card back into view if needed.
  $effect(() => {
    const id = selectedId;
    if (!id) return;
    void tick().then(() => {
      const box = boxes.get(id);
      if (box && !isOnScreen(view, box, size())) centre(id);
    });
  });

  // Wheel zoom needs a non-passive listener to stop the page from scrolling.
  $effect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = viewport.getBoundingClientRect();
      setView(
        zoomAt(view, Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top),
        false,
      );
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  });

  function zoomButton(factor: number) {
    const { width, height } = size();
    setView(zoomAt(view, factor, width / 2, height / 2), true);
  }

  // Panning: drag anywhere. A drag of more than 4 px is not a click.
  let drag: { sx: number; sy: number; vx: number; vy: number; moved: boolean } | null = null;
  let panning = $state(false);
  let suppressClick = false;

  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0 || (e.target as Element).closest('.zoom')) return;
    drag = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false };
  }
  function onPointerMove(e: PointerEvent) {
    if (!drag) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    panning = true;
    tip = null;
    setView({ ...view, x: drag.vx + dx, y: drag.vy + dy }, false);
  }
  function onPointerUp() {
    if (drag?.moved) {
      suppressClick = true;
      setTimeout(() => (suppressClick = false), 0);
    }
    drag = null;
    panning = false;
  }

  function select(id: PersonId | null) {
    if (!suppressClick) onselect(id);
  }

  // Hover tooltip (PERS-04/05).
  let tip = $state<{ person: Person; x: number; y: number } | null>(null);
  let tipEl = $state<HTMLDivElement>();
  function hover(person: Person, e: MouseEvent | null) {
    if (!e || panning) {
      tip = null;
      return;
    }
    const tipWidth = tipEl?.offsetWidth ?? 0;
    tip = {
      person,
      x: Math.min(e.clientX + 16, window.innerWidth - tipWidth - 10),
      y: e.clientY + 18,
    };
  }
  const tipText = $derived(tip ? tooltipLines(tip.person) : null);

  const lineClass = (on: boolean) => (hl ? (on ? 'hl' : 'dim') : '');
  const gapD = ({ x, y }: Point) => `M${x - 5} ${y} H${x + 5}`;
</script>

<svelte:window onpointermove={onPointerMove} onpointerup={onPointerUp} />

<!-- The tree is one big pannable drawing. The cards inside are buttons (keyboard: Tab, Enter, Esc);
     dragging and clicking the background is a mouse-only extra, hence the ignore. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class="viewport"
  class:panning
  bind:this={viewport}
  onpointerdown={onPointerDown}
  onclick={(e) => {
    if (!(e.target as Element).closest('.zoom')) select(null);
  }}
>
  <div
    class="world"
    class:animate
    data-testid="world"
    style:transform="translate({view.x}px, {view.y}px) scale({view.k})"
  >
    <svg class="edges" width={layout.width} height={layout.height} aria-hidden="true">
      {#each layout.coupleLines as line (line.partnershipId)}
        {@const cls = lineClass(!!hl?.couples.has(line.partnershipId))}
        <path class={cls} d={pathD(line.points)} />
        {#if line.ended}
          <path class="gap" d={gapD(line.middle)} />
          <path class={cls} d={endMarkD(line.middle)}><title>{endWord(line.ended)}</title></path>
        {/if}
      {/each}
      {#each layout.childLines as line, i (i)}
        {@const on = hl?.childLines[i]}
        {#each line.stems as stem, s (s)}
          <path class={lineClass(!!on?.stems)} class:dashed={line.kind} d={pathD(stem)}>
            {#if line.kind}<title>{kindLabel(line.kind)}</title>{/if}
          </path>
        {/each}
        {#each line.drops as drop (drop.childId)}
          <path
            class={lineClass(!!on?.drops.has(drop.childId))}
            class:dashed={line.kind}
            d={pathD(drop.points)}
          >
            {#if line.kind}<title>{kindLabel(line.kind)}</title>{/if}
          </path>
        {/each}
      {/each}
    </svg>
    {#each layout.cards as box (box.id)}
      {@const person = findPerson(project, box.id)}
      {#if person}
        <PersonCard
          {person}
          {box}
          selected={box.id === selectedId}
          dim={!!focus && !focus.has(box.id)}
          onselect={() => select(box.id)}
          oncentre={() => centre(box.id)}
          onhover={(e) => hover(person, e)}
        />
      {/if}
    {/each}
  </div>

  <div class="zoom">
    <button type="button" class="btn" title="Vergrößern" onclick={() => zoomButton(1.25)}>+</button>
    <button type="button" class="btn" title="Verkleinern" onclick={() => zoomButton(0.8)}>−</button>
    <button type="button" class="btn" onclick={() => fitAll()}>⤢ Alles anzeigen</button>
  </div>
</div>

{#if tip && tipText}
  <div
    class="tooltip"
    role="tooltip"
    bind:this={tipEl}
    style:left="{tip.x}px"
    style:top="{tip.y}px"
  >
    <b>{tipText.title}</b>
    {#each tipText.lines as line, i (i)}<br />{line}{/each}
  </div>
{/if}

<style>
  .viewport {
    position: relative;
    flex: 1;
    overflow: hidden;
    cursor: grab;
    touch-action: none;
    background-color: var(--canvas);
    background-image: radial-gradient(rgba(140, 100, 10, 0.1) 1px, transparent 1px);
    background-size: 22px 22px;
  }
  .viewport.panning {
    cursor: grabbing;
  }
  .world {
    position: absolute;
    left: 0;
    top: 0;
    transform-origin: 0 0;
  }
  .world.animate {
    transition: transform 0.35s ease;
  }
  .edges {
    position: absolute;
    left: 0;
    top: 0;
    overflow: visible;
  }
  .edges path {
    fill: none;
    stroke: var(--line);
    stroke-width: 2;
    transition: opacity 0.2s;
  }
  .edges path.dashed {
    stroke-dasharray: 7 5;
  }
  .edges path.gap {
    stroke: var(--canvas);
    stroke-width: 4;
  }
  .edges path.hl {
    stroke: var(--line-hl);
    stroke-width: 3;
  }
  .edges path.dim {
    opacity: 0.2;
  }
  .zoom {
    position: absolute;
    right: 16px;
    bottom: 16px;
    display: flex;
    gap: 6px;
    cursor: default;
  }
  .zoom .btn {
    min-width: 44px;
    font-size: 1.15rem;
    padding: 6px 12px;
    box-shadow: var(--card-shadow);
  }
  .tooltip {
    position: fixed;
    z-index: 40;
    pointer-events: none;
    background: var(--tip-bg);
    color: var(--tip-ink);
    padding: 10px 12px;
    border-radius: 8px;
    max-width: 320px;
    font-size: 0.92rem;
    line-height: 1.45;
    box-shadow: var(--shadow);
  }
</style>
