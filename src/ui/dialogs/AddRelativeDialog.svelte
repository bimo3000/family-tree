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
  import { language, t } from '../i18n/index.svelte';
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

  const KINDS: Exclude<ParentChildKind, 'biological'>[] = ['adoptive', 'step', 'foster'];
  const title = $derived(t.addRelative.titles[kind]);

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
      .sort((a, b) => fullName(a).localeCompare(fullName(b), language())),
  );

  let withId = $state(partners.at(-1) ?? '');
  let parentKind = $state<ParentChildKind>('adoptive');
  let who = $state<'new' | 'existing'>('new');
  let existingId = $state(candidates[0]?.id ?? '');
  let childKind = $state<ParentChildKind>('adoptive');
  let error = $state('');

  /**
   * The parents the new or chosen person gets in the child flow. A sibling gets all of the person's
   * parents, but only the biological ones can need another kind (the others are copied as they are).
   */
  const newParents = $derived(
    kind === 'child'
      ? [id, ...(partners.length > 1 ? [withId] : partners)].filter(Boolean)
      : biological,
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
    // A second parent becomes the first one's partner, like "+ Kind" (decided 2026-10-24).
    const known = biological.length === 1 ? { partnerOf: biological[0]! } : {};
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

<Modal label={title} {onclose}>
  <h2>{title}</h2>
  <p class="muted">{t.addRelative.to(shortName(person))}</p>

  {#if kind === 'child' && partners.length > 1}
    <fieldset>
      <legend>{t.addRelative.withWhom}</legend>
      {#each partners as partnerId (partnerId)}
        <label class="radio">
          <input type="radio" name="with" value={partnerId} bind:group={withId} />
          {name(partnerId)}
        </label>
      {/each}
      <label class="radio">
        <input type="radio" name="with" value="" bind:group={withId} />
        {t.addRelative.otherParent}
      </label>
    </fieldset>
  {:else if kind === 'child' && partners.length === 1}
    <p class="muted">{t.addRelative.alsoChildOf(name(partners[0]!))}</p>
  {/if}

  {#if kind === 'parent' && biological.length >= 2}
    <fieldset>
      <legend>{t.addRelative.twoParents(shortName(person))}</legend>
      {#each KINDS as value (value)}
        <label class="radio">
          <input type="radio" name="pkind" {value} bind:group={parentKind} />
          {t.words.parent(undefined, value)}
        </label>
      {/each}
    </fieldset>
  {:else if kind === 'parent' && biological.length === 1}
    <p class="muted">{t.addRelative.partnerOf(name(biological[0]!))}</p>
  {/if}

  {#if kind === 'sibling' && parents.length === 0}
    <p class="muted">{t.addRelative.placeholder}</p>
  {/if}

  <fieldset>
    <legend>{t.addRelative.who}</legend>
    <label class="radio">
      <input type="radio" name="who" value="new" bind:group={who} />
      {t.addRelative.newPerson}
    </label>
    <label class="radio">
      <input
        type="radio"
        name="who"
        value="existing"
        bind:group={who}
        disabled={!candidates.length}
      />
      {t.addRelative.existing}
    </label>
    {#if who === 'existing'}
      <select aria-label={t.addRelative.existingLabel} bind:value={existingId}>
        {#each candidates as c (c.id)}
          <option value={c.id}>{fullName(c)} {yearsLine(c)}</option>
        {/each}
      </select>
    {/if}
  </fieldset>

  {#if askChildKind}
    {@const n = name(existingId)}
    <fieldset>
      <legend>{t.addRelative.whatChild(n, newParents.map(name))}</legend>
      {#each KINDS as value (value)}
        <label class="radio">
          <input type="radio" name="ckind" {value} bind:group={childKind} />
          {t.words.kind(value)}
        </label>
      {/each}
    </fieldset>
  {/if}

  {#if error}<p class="error" role="alert">{error}</p>{/if}
  <div class="form-actions">
    <button type="button" class="btn primary" onclick={confirm}>{t.addRelative.add}</button>
    <button type="button" class="btn" onclick={onclose}>{t.common.cancel}</button>
  </div>
</Modal>
