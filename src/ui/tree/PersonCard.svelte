<script lang="ts">
  import type { CardBox } from '../../core/layout';
  import type { Person } from '../../core/model/types';
  import { usePhotos } from '../photos';
  import { fullName, initials, yearsLine } from '../text';

  interface Props {
    person: Person;
    box: CardBox;
    selected: boolean;
    dim: boolean;
    onselect: () => void;
    oncentre: () => void;
    onhover: (e: MouseEvent | null) => void;
  }
  let { person, box, selected, dim, onselect, oncentre, onhover }: Props = $props();

  const photoUrl = usePhotos();
  const photo = $derived(photoUrl(person.photoId));
</script>

<!-- A button, so every person can also be reached with the keyboard. The tooltip follows the mouse. -->
<button
  type="button"
  class="card"
  class:unknown={box.placeholder}
  class:selected
  class:dim
  data-id={person.id}
  style:left="{box.x - box.width / 2}px"
  style:top="{box.y - box.height / 2}px"
  style:width="{box.width}px"
  style:height="{box.height}px"
  aria-label={box.placeholder ? 'Unbekannter Elternteil' : fullName(person)}
  onclick={(e) => {
    e.stopPropagation();
    onselect();
  }}
  ondblclick={oncentre}
  onmouseenter={(e) => onhover(e)}
  onmousemove={(e) => onhover(e)}
  onmouseleave={() => onhover(null)}
>
  {#if box.placeholder}
    ?
  {:else}
    <span class="ph">
      {#if photo}<img src={photo} alt="" draggable="false" />{:else}{initials(person)}{/if}
    </span>
    <span class="txt">
      <span class="nm">{fullName(person)}</span>
      <span class="yr">{yearsLine(person)}</span>
    </span>
  {/if}
</button>

<style>
  .card {
    position: absolute;
    display: flex;
    flex-direction: column;
    padding: 6px 6px 0;
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--radius);
    box-shadow: var(--card-shadow);
    overflow: hidden;
    user-select: none;
    text-align: center;
    /* After a change the layout is recomputed: cards glide to their new places (ui-concept §3). */
    transition:
      opacity 0.2s,
      box-shadow 0.2s,
      left 0.35s ease,
      top 0.35s ease;
  }
  .card:hover {
    box-shadow: var(--card-shadow-hover);
  }
  .card.dim {
    opacity: 0.3;
  }
  .card.selected {
    border-color: var(--selected);
    box-shadow:
      0 0 0 3px var(--selected),
      var(--card-shadow-hover);
  }
  .ph {
    flex: none;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ph-bg);
    color: var(--ph-ink);
    font-size: 2rem;
    font-weight: 600;
    border-radius: calc(var(--radius) - 4px);
    overflow: hidden;
  }
  .ph img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 50% 30%;
  }
  .txt {
    min-width: 0;
    padding: 6px 4px;
  }
  .nm {
    font-weight: 600;
    line-height: 1.2;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .yr {
    display: block;
    color: var(--muted);
    font-size: 0.9rem;
    margin-top: 3px;
    white-space: nowrap;
  }
  .card.unknown {
    padding: 0;
    border: 2px dashed var(--line-hl);
    border-radius: 50%;
    background: var(--card-bg);
    box-shadow: none;
    color: var(--accent);
    font-size: 1.8rem;
    font-weight: 700;
    align-items: center;
    justify-content: center;
  }
  /* Printed without shadows, fading or selection (UI-03). */
  @media print {
    .card,
    .card.selected {
      box-shadow: none;
      transition: none;
    }
    .card.selected:not(.unknown) {
      border-color: var(--card-border);
    }
    .card.dim {
      opacity: 1;
    }
  }
</style>
