<script lang="ts">
  import { isPlaceholder } from '../../core/model/queries';
  import type { Person, PersonId, Project } from '../../core/model/types';
  import { fullName, initials, personFacts } from '../text';
  import { familyGroups } from './family';

  interface Props {
    project: Project;
    person: Person;
    ongoto: (id: PersonId) => void;
    onclose: () => void;
  }
  let { project, person, ongoto, onclose }: Props = $props();

  const unknown = $derived(isPlaceholder(person));
  const facts = $derived(personFacts(person));
  const groups = $derived(familyGroups(project, person.id));
  const empty = $derived(
    !facts.length && !person.biography && !person.givenNames && !person.surname,
  );
</script>

<!-- Read-only details of the selected person (PERS-05). Editing follows in slice S4. -->
<aside class="panel" aria-label="Details">
  <button type="button" class="close" title="Schließen (Esc)" onclick={onclose}>×</button>
  {#if unknown}
    <div class="p-photo p-unknown">?</div>
    <h2>Unbekannter Elternteil</h2>
    <p class="muted">
      Diese Person ist noch nicht bekannt. Sie wurde angelegt, damit Geschwister zusammengehören.
    </p>
  {:else}
    <div class="p-photo">{initials(person)}</div>
    <h2>{fullName(person)}</h2>
    {#if person.birthName}<div class="geb">geb. {person.birthName}</div>{/if}
    {#if empty}<p class="muted">Noch keine Angaben.</p>{/if}
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
          {/each}
        </div>
      </div>
    {/each}
  {/if}
</aside>

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
  .fam-link {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 6px 8px;
    border-radius: 6px;
  }
  .fam-link:hover {
    background: var(--hover);
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
