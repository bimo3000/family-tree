<script lang="ts">
  import { untrack } from 'svelte';
  import {
    type Relation,
    childLinksOf,
    findPerson,
    isPlaceholder,
    parentLinksOf,
  } from '../../core/model/queries';
  import { cutOffBy, ends } from '../../core/model/relatives';
  import type { PersonId, Project } from '../../core/model/types';
  import { parentWord, shortName } from '../text';
  import Modal from './Modal.svelte';

  interface Props {
    project: Project;
    relation: Relation;
    /** Removes the relation and, with `alsoDelete`, the person it left on their own. */
    onremove: (alsoDelete: PersonId | null) => void;
    onclose: () => void;
  }
  let { project, relation, onremove, onclose }: Props = $props();

  // ui-concept §2.8: one sentence on what changes, then who would be cut off from the rest.
  const { what, cut } = untrack(() => {
    const person = (id: PersonId) => findPerson(project, id) ?? { id };
    const [a, b] = ends(relation);
    const [na, nb] = [a, b].map((id) => shortName(person(id)));
    let what: string;
    if ('partners' in relation) {
      const shared = childLinksOf(project, a).some((l) =>
        parentLinksOf(project, l.childId).some((m) => m.parentId === b),
      );
      what = `${na} und ${nb} sind dann kein Paar mehr.`;
      if (shared) what += ' Gemeinsame Kinder bleiben Kinder von beiden.';
    } else if (isPlaceholder(person(a))) {
      what = `Die Verbindung von ${nb} zum unbekannten Elternteil wird entfernt.`;
    } else {
      what = `${na} ist dann nicht mehr ${parentWord(person(a), relation.kind)} von ${nb}.`;
    }
    return { what, cut: cutOffBy(project, relation) };
  });
  const lone = cut.length === 1 ? cut[0]! : null;
  const loneName = lone ? untrack(() => shortName(findPerson(project, lone) ?? { id: lone })) : '';
</script>

<Modal label="Verbindung entfernen?" {onclose}>
  <h2>Verbindung entfernen?</h2>
  <p>{what}</p>
  {#if lone}
    <p>
      Danach hat {loneName} keine Verbindung mehr zu anderen Personen. Du kannst {loneName} behalten (steht
      dann allein neben dem Stammbaum) oder ganz löschen.
    </p>
  {:else if cut.length > 1}
    <p>
      Danach hängen {cut.length} Personen nicht mehr mit dem übrigen Stammbaum zusammen. Sie bleiben erhalten
      und stehen daneben, bis du sie wieder verbindest.
    </p>
  {/if}
  <p class="muted small">Mit ↶ kannst du das rückgängig machen.</p>
  <div class="form-actions">
    <button type="button" class="btn primary" onclick={() => onremove(null)}>
      {lone ? 'Nur Verbindung entfernen' : 'Verbindung entfernen'}
    </button>
    {#if lone}
      <button type="button" class="btn danger" onclick={() => onremove(lone)}>
        {loneName} ganz löschen
      </button>
    {/if}
    <button type="button" class="btn" onclick={onclose}>Abbrechen</button>
  </div>
</Modal>
