<script lang="ts">
  import { type Relation, isPlaceholder } from '../../core/model/queries';
  import type { Person, PersonId, Project } from '../../core/model/types';
  import type { RelativeKind } from '../dialogs/AddRelativeDialog.svelte';
  import { usePhotos } from '../photos';
  import { fullName, initials, personFacts } from '../text';
  import { familyGroups } from './family';

  interface Props {
    project: Project;
    person: Person;
    ongoto: (id: PersonId) => void;
    onclose: () => void;
    onedit: () => void;
    onadd: (kind: RelativeKind) => void;
    ondelete: () => void;
    onrelation: (relation: Relation, action: 'edit' | 'remove') => void;
  }
  let { project, person, ongoto, onclose, onedit, onadd, ondelete, onrelation }: Props = $props();

  const ADD: [RelativeKind, string][] = [
    ['parent', '+ Elternteil'],
    ['partner', '+ Partner/in'],
    ['child', '+ Kind'],
    ['sibling', '+ Geschwister'],
  ];

  const PENCIL =
    'M4 16l.9-3.6L13.3 4a1.5 1.5 0 0 1 2.1 0l.6.6a1.5 1.5 0 0 1 0 2.1L7.6 15.1 4 16zM12 5.3l2.7 2.7';
  const CROSS = 'M5.5 5.5l9 9M14.5 5.5l-9 9';

  const photoUrl = usePhotos();
  const photo = $derived(photoUrl(person.photoId));
  const unknown = $derived(isPlaceholder(person));
  const facts = $derived(personFacts(person));
  const groups = $derived(familyGroups(project, person.id));
  const empty = $derived(
    !facts.length && !person.biography && !person.givenNames && !person.surname,
  );
</script>

<!-- Details of the selected person (PERS-05) and the starting points for every change (ui-concept §2.4). -->
<aside class="panel" aria-label="Details">
  <button type="button" class="close" title="Schließen (Esc)" onclick={onclose}>×</button>
  {#if unknown}
    <div class="p-photo p-unknown">?</div>
    <h2>Unbekannter Elternteil</h2>
    <p class="muted">
      Diese Person ist noch nicht bekannt. Sie wurde angelegt, damit Geschwister zusammengehören.
    </p>
  {:else}
    <div class="p-photo">
      {#if photo}<img src={photo} alt="" />{:else}{initials(person)}{/if}
    </div>
    <h2>{fullName(person)}</h2>
    {#if person.birthName}<div class="geb">geb. {person.birthName}</div>{/if}
    {#if empty}<p class="muted">Noch keine Angaben. Klick auf „Bearbeiten“.</p>{/if}
    {#if facts.length}
      <dl class="facts">
        {#each facts as [label, value], i (i)}
          <dt>{label}</dt>
          <dd>{value}</dd>
        {/each}
      </dl>
    {/if}
    {#if person.biography}
      <h3>Lebensgeschichte</h3>
      <p class="bio">{person.biography}</p>
    {/if}
  {/if}

  {#if groups.length}
    <h3>Familie</h3>
    {#each groups as group (group.title)}
      <div class="fam">
        <div class="fam-title">{group.title}</div>
        <div class="fam-list">
          {#each group.entries as entry (entry.id)}
            <div class="fam-row">
              <button type="button" class="fam-link" onclick={() => ongoto(entry.id)}>
                <span class="fam-name">
                  {#if entry.unknown}<i>{entry.name}</i>{:else}{entry.name}{/if}
                </span>
                {#if entry.info.length}
                  <span class="fam-info">
                    {#each entry.info as part, i (i)}
                      {#if i}<span class="sep">|</span>{/if}{part}
                    {/each}
                  </span>
                {/if}
                {#if entry.detail}<span class="fam-info">{entry.detail}</span>{/if}
              </button>
              {#if entry.relation}
                {@const relation = entry.relation}
                <button
                  type="button"
                  class="fam-tool"
                  title="Beziehung bearbeiten"
                  aria-label="Beziehung zu {entry.name} bearbeiten"
                  onclick={() => onrelation(relation, 'edit')}
                >
                  {@render icon(PENCIL)}
                </button>
                <button
                  type="button"
                  class="fam-tool remove"
                  title="Verbindung entfernen"
                  aria-label="Verbindung zu {entry.name} entfernen"
                  onclick={() => onrelation(relation, 'remove')}
                >
                  {@render icon(CROSS)}
                </button>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/each}
  {/if}

  {#if unknown}
    <div class="actions">
      <button type="button" class="btn primary wide" onclick={onedit}>Person eintragen</button>
    </div>
  {:else}
    <div class="actions">
      <button type="button" class="btn primary wide" onclick={onedit}>Bearbeiten</button>
      {#each ADD as [kind, label] (kind)}
        <button type="button" class="btn" onclick={() => onadd(kind)}>{label}</button>
      {/each}
    </div>
    <button type="button" class="link danger" onclick={ondelete}>Person löschen</button>
  {/if}
</aside>

<!-- Drawn icons instead of font characters (✎ renders small and unclear in many fonts). -->
{#snippet icon(d: string)}
  <svg
    viewBox="0 0 20 20"
    width="18"
    height="18"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path {d} />
  </svg>
{/snippet}

<style>
  .panel {
    width: 410px;
    flex: none;
    background: var(--panel-bg);
    border-left: 1px solid var(--bar-border);
    overflow-y: auto;
    padding: 18px 24px 40px;
    position: relative;
  }
  .close {
    position: absolute;
    z-index: 2;
    right: 12px;
    top: 10px;
    width: 40px;
    height: 40px;
    font-size: 1.6rem;
    line-height: 1;
    background: none;
    border: none;
    border-radius: 50%;
    color: var(--muted);
  }
  .close:hover {
    background: var(--hover);
  }
  /* The panel photo looks like a print glued into an album. */
  .p-photo {
    width: 100%;
    height: 260px;
    border: 9px solid #fff;
    box-shadow: 0 3px 10px rgba(80, 60, 10, 0.25);
    transform: rotate(-1deg);
    margin: 34px 0 14px;
    background: var(--ph-bg);
    color: var(--ph-ink);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    font-weight: 600;
    overflow: hidden;
  }
  .p-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 50% 30%;
  }
  .p-unknown {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    transform: none;
  }
  .geb {
    color: var(--muted);
    margin-bottom: 6px;
  }
  .facts {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 6px 14px;
    margin: 14px 0 0;
  }
  .facts dt {
    color: var(--muted);
  }
  .facts dd {
    margin: 0;
  }
  .bio {
    white-space: pre-line;
    line-height: 1.5;
    margin: 0;
  }
  /* Family: group title, then the entries indented along a thin line. */
  .fam {
    margin-bottom: 14px;
  }
  .fam-title {
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    margin-bottom: 4px;
  }
  .fam-list {
    border-left: 2px solid var(--line-soft);
    padding-left: 6px;
  }
  .fam-row {
    display: flex;
    align-items: center;
    gap: 2px;
    padding-right: 8px;
    border-radius: 6px;
  }
  .fam-row:hover {
    background: var(--hover);
  }
  .fam-link {
    flex: 1;
    min-width: 0;
    text-align: left;
    background: none;
    border: none;
    padding: 6px 8px;
  }
  .fam-tool {
    flex: none;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    background: none;
    border-radius: 50%;
    color: var(--muted);
    opacity: 0.6;
  }
  .fam-row:hover .fam-tool {
    opacity: 1;
  }
  .fam-tool:hover {
    background: var(--card-bg);
    color: var(--ink);
  }
  .fam-tool.remove:hover {
    color: var(--danger);
  }
  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin: 22px 0 12px;
  }
  .actions .wide {
    grid-column: 1 / -1;
  }
  .fam-name {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .fam-info {
    display: block;
    color: var(--muted);
    font-size: 0.88rem;
    margin-top: 1px;
  }
  .sep {
    margin: 0 0.55em;
    color: var(--line);
  }
</style>
