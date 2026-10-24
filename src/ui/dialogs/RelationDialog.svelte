<script lang="ts">
  import { untrack } from 'svelte';
  import { setParentChildKind, updatePartnership } from '../../core/model/operations';
  import { type Relation, findPerson, isBiological, parentLinksOf } from '../../core/model/queries';
  import type {
    ParentChildKind,
    PartnershipDetails,
    PartnershipEndReason,
    PartnershipKind,
    PersonId,
    Project,
  } from '../../core/model/types';
  import { fmtDate, shortName } from '../text';
  import DateField from './DateField.svelte';
  import { lifeEvent } from './fields';
  import Modal from './Modal.svelte';

  interface Props {
    project: Project;
    relation: Relation;
    /** Applied at once. `key` merges the typing in one field into one undo step. */
    onchange: (change: (project: Project) => Project, key?: string) => void;
    onfocus: () => void;
    onclose: () => void;
  }
  let { project, relation, onchange, onfocus, onclose }: Props = $props();

  // Filled once; after undo/redo the whole dialog is rebuilt (App.svelte).
  const start = untrack(() => relation);
  const name = (id: PersonId) => untrack(() => shortName(findPerson(project, id) ?? { id }));

  // ---------------------------------------------------------------- partner (ui-concept §2.8)
  const p = 'partners' in start ? start : undefined;
  const f = $state({
    kind: p?.kind ?? '',
    startDate: fmtDate(p?.start?.date),
    startPlace: p?.start?.place ?? '',
    endReason: p?.end?.reason ?? '',
    endDate: fmtDate(p?.end?.date),
  });

  function details(): PartnershipDetails {
    const endDate = lifeEvent(f.endDate, '').date;
    return {
      ...(f.kind ? { kind: f.kind as PartnershipKind } : {}),
      start: lifeEvent(f.startDate, f.startPlace),
      ...(f.endReason
        ? {
            end: {
              reason: f.endReason as PartnershipEndReason,
              ...(endDate ? { date: endDate } : {}),
            },
          }
        : {}),
    };
  }

  function applyPartner(key?: string) {
    if (!p) return;
    const d = details();
    onchange((project) => updatePartnership(project, p.id, d), key && `rel:${p.id}:${key}`);
  }

  // ---------------------------------------------------------------- parent and child
  const l = 'partners' in start ? undefined : start;
  let childKind = $state<ParentChildKind>(l?.kind ?? 'biological');
  /** "leiblich" is not possible if the child already has two other biological parents. */
  const biologicalAllowed = untrack(
    () =>
      !l ||
      isBiological(l) ||
      parentLinksOf(project, l.childId).filter((x) => isBiological(x) && x.parentId !== l.parentId)
        .length < 2,
  );
  const CHILD_KINDS: [ParentChildKind, string][] = [
    ['biological', 'leibliches Kind'],
    ['adoptive', 'Adoptivkind'],
    ['step', 'Stiefkind'],
    ['foster', 'Pflegekind'],
  ];
</script>

<Modal label="Beziehung bearbeiten" {onclose}>
  <h2>Beziehung bearbeiten</h2>
  {#if p}
    <p class="muted">{name(p.partners[0])} und {name(p.partners[1])}</p>
    <div class="form" onfocusin={onfocus}>
      <fieldset>
        <legend>Art der Beziehung</legend>
        {#each [['', 'Paar (keine nähere Angabe)'], ['marriage', 'Ehe'], ['partnership', 'Eingetragene Partnerschaft']] as [value, label] (value)}
          <label class="radio">
            <input
              type="radio"
              name="rkind"
              {value}
              checked={f.kind === value}
              onchange={() => {
                f.kind = value!;
                applyPartner();
              }}
            />
            {label}
          </label>
        {/each}
      </fieldset>
      <div class="pair">
        <DateField
          label="Seit"
          value={f.startDate}
          oninput={(v) => {
            f.startDate = v;
            applyPartner('startDate');
          }}
        />
        <label>
          in
          <input
            type="text"
            value={f.startPlace}
            oninput={(e) => {
              f.startPlace = e.currentTarget.value;
              applyPartner('startPlace');
            }}
          />
        </label>
      </div>
      <fieldset>
        <legend>Getrennt?</legend>
        {#each [['', 'nein'], ['separation', 'getrennt'], ['divorce', 'geschieden']] as [value, label] (value)}
          <label class="radio">
            <input
              type="radio"
              name="rend"
              {value}
              checked={f.endReason === value}
              onchange={() => {
                f.endReason = value!;
                applyPartner();
              }}
            />
            {label}
          </label>
        {/each}
      </fieldset>
      {#if f.endReason}
        <DateField
          label="Seit wann?"
          value={f.endDate}
          oninput={(v) => {
            f.endDate = v;
            applyPartner('endDate');
          }}
        />
      {/if}
    </div>
  {:else if l}
    <p class="muted">{name(l.childId)} ist für {name(l.parentId)} ein …</p>
    <fieldset>
      {#each CHILD_KINDS as [value, label] (value)}
        {@const disabled = value === 'biological' && !biologicalAllowed}
        <label class="radio">
          <input
            type="radio"
            name="pkind"
            {value}
            {disabled}
            checked={childKind === value}
            onchange={() => {
              childKind = value;
              onchange((project) => setParentChildKind(project, l.parentId, l.childId, value));
            }}
          />
          {label}
          {#if disabled}<span class="muted small">(hat schon zwei leibliche Eltern)</span>{/if}
        </label>
      {/each}
    </fieldset>
  {/if}
  <div class="form-actions">
    <button type="button" class="btn primary" onclick={onclose}>Fertig</button>
  </div>
</Modal>
