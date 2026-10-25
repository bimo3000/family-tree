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
  import { t } from '../i18n/index.svelte';
  import { shortName } from '../text';
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
    const [na, nb] = [shortName(person(a)), shortName(person(b))];
    let what: string;
    if ('partners' in relation) {
      const shared = childLinksOf(project, a).some((l) =>
        parentLinksOf(project, l.childId).some((m) => m.parentId === b),
      );
      what = t.removeRelation.noCouple(na, nb);
      if (shared) what += ' ' + t.removeRelation.sharedChildren;
    } else if (isPlaceholder(person(a))) {
      what = t.removeRelation.fromPlaceholder(nb);
    } else {
      what = t.removeRelation.noParent(na, nb, person(a).gender, relation.kind);
    }
    return { what, cut: cutOffBy(project, relation) };
  });
  const lone = cut.length === 1 ? cut[0]! : null;
  const loneName = lone ? untrack(() => shortName(findPerson(project, lone) ?? { id: lone })) : '';
</script>

<Modal label={t.removeRelation.title} {onclose}>
  <h2>{t.removeRelation.title}</h2>
  <p>{what}</p>
  {#if lone}
    <p>{t.removeRelation.alone(loneName)}</p>
  {:else if cut.length > 1}
    <p>{t.removeRelation.apart(cut.length)}</p>
  {/if}
  <p class="muted small">{t.common.undoHint}</p>
  <div class="form-actions">
    <button type="button" class="btn primary" onclick={() => onremove(null)}>
      {lone ? t.removeRelation.onlyRemove : t.removeRelation.remove}
    </button>
    {#if lone}
      <button type="button" class="btn danger" onclick={() => onremove(lone)}>
        {t.removeRelation.deleteToo(loneName)}
      </button>
    {/if}
    <button type="button" class="btn" onclick={onclose}>{t.common.cancel}</button>
  </div>
</Modal>
