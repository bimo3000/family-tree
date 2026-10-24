<script lang="ts" module>
  export type RelativeKind = 'child' | 'partner' | 'parent' | 'sibling';
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import type { Added } from '../../core/model/operations';
  import {
    findPerson,
    isBiological,
    isPlaceholder,
    parentLinksOf,
    partnerOf,
    partnershipsOf,
  } from '../../core/model/queries';
  import {
    addChild,
    addParent,
    addPartner,
    addSibling,
    childKindNeeded,
    type RelativeOptions,
  } from '../../core/model/relatives';
  import type { ParentChildKind, Person, PersonId, Project } from '../../core/model/types';
  import { ModelError } from '../../core/model/validation';
  import { errorText, fullName, shortName, yearsLine } from '../text';
  import Modal from './Modal.svelte';

  interface Props {
    project: Project;
    person: Person;
    kind: RelativeKind;
    /** Runs the change; throws a ModelError if the rules forbid it. */
    onadd: (change: (project: Project) => Added, isNew: boolean) => void;
    onclose: () => void;
  }
  let { project, person, kind, onadd, onclose }: Props = $props();

  const TITLES: Record<RelativeKind, string> = {
    child: 'Kind hinzufügen',
    partner: 'Partner/in hinzufügen',
    parent: 'Elternteil hinzufügen',
    sibling: 'Geschwister hinzufügen',
  };
  const KINDS: [Exclude<ParentChildKind, 'biological'>, string, string][] = [
    ['adoptive', 'Adoptivkind', 'Adoptivelternteil'],
    ['step', 'Stiefkind', 'Stiefelternteil'],
    ['foster', 'Pflegekind', 'Pflegeelternteil'],
  ];

  const name = (id: PersonId) => shortName(findPerson(project, id) ?? { id });
  // The situation when the dialog opened; the project does not change while it is open.
  const { id, partners, biological, parents } = untrack(() => ({
    id: person.id,
    partners: partnershipsOf(project, person.id).map((r) => partnerOf(r, person.id)),
    biological: parentLinksOf(project, person.id)
      .filter(isBiological)
      .map((l) => l.parentId),
    parents: parentLinksOf(project, person.id).map((l) => l.parentId),
  }));
  const candidates = untrack(() =>
    project.persons
      .filter((p) => p.id !== id && !isPlaceholder(p))
      .sort((a, b) => fullName(a).localeCompare(fullName(b), 'de')),
  );

  let withId = $state(partners.at(-1) ?? '');
  let parentKind = $state<ParentChildKind>('adoptive');
  let couple = $state(true);
  let who = $state<'new' | 'existing'>('new');
  let existingId = $state(candidates[0]?.id ?? '');
  let childKind = $state<ParentChildKind>('adoptive');
  let error = $state('');

  /** The parents the new or chosen person gets in the child and sibling flows. */
  const newParents = $derived(
    kind === 'child'
      ? [id, ...(partners.length > 1 ? [withId] : partners)].filter(Boolean)
      : parents,
  );
  /** "Was für ein Kind …?" appears only if the chosen person would get a third biological parent. */
  const askChildKind = $derived(
    who === 'existing' &&
      (kind === 'child' || kind === 'sibling') &&
      !!existingId &&
      childKindNeeded(project, existingId, newParents),
  );

  function change(): (project: Project) => Added {
    const options: RelativeOptions = who === 'existing' ? { existingId } : {};
    if (askChildKind) options.kind = childKind;
    if (kind === 'child') return (p) => addChild(p, newParents, options);
    if (kind === 'partner') return (p) => addPartner(p, id, options);
    if (kind === 'sibling') return (p) => addSibling(p, id, options);
    if (biological.length >= 2) options.kind = parentKind;
    const known = biological.length === 1 && couple ? { partnerOf: biological[0]! } : {};
    return (p) => addParent(p, id, { ...options, ...known });
  }

  function confirm() {
    error = '';
    try {
      onadd(change(), who === 'new');
    } catch (e) {
      if (!(e instanceof ModelError)) throw e;
      error = errorText(e.code);
    }
  }
</script>

<Modal label={TITLES[kind]} {onclose}>
  <h2>{TITLES[kind]}</h2>
  <p class="muted">zu {shortName(person)}</p>

  {#if kind === 'child' && partners.length > 1}
    <fieldset>
      <legend>Mit wem?</legend>
      {#each partners as partnerId (partnerId)}
        <label class="radio">
          <input type="radio" name="with" value={partnerId} bind:group={withId} />
          {name(partnerId)}
        </label>
      {/each}
      <label class="radio">
        <input type="radio" name="with" value="" bind:group={withId} />
        anderer oder unbekannter Elternteil
      </label>
    </fieldset>
  {:else if kind === 'child' && partners.length === 1}
    <p class="muted">Das Kind wird auch als Kind von {name(partners[0]!)} eingetragen.</p>
  {/if}

  {#if kind === 'parent' && biological.length >= 2}
    <fieldset>
      <legend>
        {shortName(person)} hat schon zwei leibliche Eltern. Was für ein Elternteil kommt dazu?
      </legend>
      {#each KINDS as [value, , label] (value)}
        <label class="radio">
          <input type="radio" name="pkind" {value} bind:group={parentKind} />
          {label}
        </label>
      {/each}
    </fieldset>
  {:else if kind === 'parent' && biological.length === 1}
    <label class="radio">
      <input type="checkbox" bind:checked={couple} />
      ist Partner/in von {name(biological[0]!)}
    </label>
  {/if}

  {#if kind === 'sibling' && parents.length === 0}
    <p class="muted">
      Die Eltern sind noch unbekannt. Damit beide als Geschwister zusammengehören, wird ein
      Platzhalter „?“ als Elternteil angelegt.
    </p>
  {/if}

  <fieldset>
    <legend>Wer?</legend>
    <label class="radio">
      <input type="radio" name="who" value="new" bind:group={who} />
      Neue Person
    </label>
    <label class="radio">
      <input
        type="radio"
        name="who"
        value="existing"
        bind:group={who}
        disabled={!candidates.length}
      />
      Vorhandene Person auswählen
    </label>
    {#if who === 'existing'}
      <select aria-label="Vorhandene Person" bind:value={existingId}>
        {#each candidates as c (c.id)}
          <option value={c.id}>{fullName(c)} {yearsLine(c)}</option>
        {/each}
      </select>
    {/if}
  </fieldset>

  {#if askChildKind}
    {@const n = name(existingId)}
    <fieldset>
      <legend>
        {n} hat schon leibliche Eltern. Was für ein Kind ist {n} für {newParents
          .map(name)
          .join(' und ')}?
      </legend>
      {#each KINDS as [value, label] (value)}
        <label class="radio">
          <input type="radio" name="ckind" {value} bind:group={childKind} />
          {label}
        </label>
      {/each}
    </fieldset>
  {/if}

  {#if error}<p class="error" role="alert">{error}</p>{/if}
  <div class="form-actions">
    <button type="button" class="btn primary" onclick={confirm}>Hinzufügen</button>
    <button type="button" class="btn" onclick={onclose}>Abbrechen</button>
  </div>
</Modal>
