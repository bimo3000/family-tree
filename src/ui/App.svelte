<script lang="ts">
  import { deletePerson, updatePerson } from '../core/model/operations';
  import {
    type Relation,
    childLinksOf,
    findPerson,
    isPlaceholder,
    sameRelation,
  } from '../core/model/queries';
  import { removeRelation } from '../core/model/relatives';
  import type { PersonId } from '../core/model/types';
  import AddRelativeDialog, { type RelativeKind } from './dialogs/AddRelativeDialog.svelte';
  import DeleteDialog from './dialogs/DeleteDialog.svelte';
  import PersonDialog from './dialogs/PersonDialog.svelte';
  import RelationDialog from './dialogs/RelationDialog.svelte';
  import RemoveRelationDialog from './dialogs/RemoveRelationDialog.svelte';
  import { loadExample } from './example';
  import DetailPanel from './panel/DetailPanel.svelte';
  import { Editor } from './state/editor.svelte';
  import TreeView from './tree/TreeView.svelte';

  // Until the start screen and project files exist (slice S5), the app opens the embedded example.
  const editor = new Editor(loadExample());
  const project = $derived(editor.project);
  const selected = $derived(editor.selectedId ? findPerson(project, editor.selectedId) : undefined);
  let tree = $state<TreeView>();

  /** At most one dialog is open. Persons and relations are looked up again on every change. */
  type Dialog =
    | { type: 'person'; id: PersonId; isNew?: boolean }
    | { type: 'add'; id: PersonId; kind: RelativeKind }
    | { type: 'delete'; id: PersonId }
    | { type: 'relation'; relation: Relation }
    | { type: 'remove'; relation: Relation };
  let dialog = $state<Dialog | null>(null);
  const dialogPerson = $derived(
    dialog && 'id' in dialog ? findPerson(project, dialog.id) : undefined,
  );
  const dialogRelation = $derived.by(() => {
    const d = dialog;
    if (!d || !('relation' in d)) return undefined;
    return [...project.partnerships, ...project.parentChild].find((r) =>
      sameRelation(r, d.relation),
    );
  });
  const closeDialog = () => (dialog = null);

  /** Nothing entered, nothing added: a new relative left completely empty is removed again. */
  function closePersonDialog() {
    const d = dialog;
    dialog = null;
    if (d?.type !== 'person' || !d.isNew) return;
    const person = findPerson(project, d.id);
    if (person && isPlaceholder(person) && !childLinksOf(project, d.id).length)
      editor.apply((p) => deletePerson(p, d.id));
  }

  let toast = $state('');
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  function showToast(text: string) {
    toast = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast = ''), 4500);
  }

  function select(id: PersonId | null) {
    editor.selectedId = id;
  }

  function goto(id: PersonId) {
    select(id);
    tree?.centre(id);
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && !dialog) select(null);
    if (!(e.ctrlKey || e.metaKey)) return;
    // In a text field, Ctrl+Z belongs to the field itself.
    if ((e.target as Element).closest('input[type="text"], textarea')) return;
    const key = e.key.toLowerCase();
    if (key === 'z' && !e.shiftKey) editor.undo();
    else if (key === 'y' || (key === 'z' && e.shiftKey)) editor.redo();
    else return;
    e.preventDefault();
  }
</script>

<svelte:window {onkeydown} />

<header class="topbar">
  <h1 class="proj">{project.name}</h1>
  <button
    type="button"
    class="icon-btn"
    title="Rückgängig (Strg+Z)"
    aria-label="Rückgängig"
    disabled={!editor.canUndo}
    onclick={() => editor.undo()}>↶</button
  >
  <button
    type="button"
    class="icon-btn"
    title="Wiederholen (Strg+Y)"
    aria-label="Wiederholen"
    disabled={!editor.canRedo}
    onclick={() => editor.redo()}>↷</button
  >
</header>
<main>
  <TreeView bind:this={tree} {project} selectedId={editor.selectedId} onselect={select} />
  {#if selected}
    {@const id = selected.id}
    <DetailPanel
      {project}
      person={selected}
      ongoto={goto}
      onclose={() => select(null)}
      onedit={() => (dialog = { type: 'person', id })}
      onadd={(kind) => (dialog = { type: 'add', id, kind })}
      ondelete={() => (dialog = { type: 'delete', id })}
      onrelation={(relation, action) =>
        (dialog = { type: action === 'edit' ? 'relation' : 'remove', relation })}
    />
  {/if}
</main>

<!-- Undo and redo rebuild an open form from the restored version, hence the key. -->
{#key editor.revision}
  {#if dialog?.type === 'person' && dialogPerson}
    <PersonDialog
      person={dialogPerson}
      onchange={(person, key) => editor.apply((p) => updatePerson(p, person), key)}
      onfocus={() => editor.seal()}
      onclose={closePersonDialog}
    />
  {:else if dialog?.type === 'relation' && dialogRelation}
    <RelationDialog
      {project}
      relation={dialogRelation}
      onchange={(change, key) => editor.apply(change, key)}
      onfocus={() => editor.seal()}
      onclose={closeDialog}
    />
  {/if}
{/key}
{#if dialog?.type === 'add' && dialogPerson}
  <AddRelativeDialog
    {project}
    person={dialogPerson}
    kind={dialog.kind}
    onadd={(change, isNew) => {
      const id = editor.add(change);
      select(id);
      // A new person is still empty: go straight on to entering their data.
      dialog = isNew ? { type: 'person', id, isNew } : null;
    }}
    onclose={closeDialog}
  />
{:else if dialog?.type === 'delete' && dialogPerson}
  {@const id = dialogPerson.id}
  <DeleteDialog
    person={dialogPerson}
    ondelete={() => {
      editor.apply((p) => deletePerson(p, id));
      dialog = null;
      showToast('Gelöscht. Mit ↶ kannst du das rückgängig machen.');
    }}
    onclose={closeDialog}
  />
{:else if dialog?.type === 'remove' && dialogRelation}
  {@const relation = dialogRelation}
  <RemoveRelationDialog
    {project}
    {relation}
    onremove={(alsoDelete) => {
      editor.apply((p) => {
        const without = removeRelation(p, relation);
        return alsoDelete ? deletePerson(without, alsoDelete) : without;
      });
      dialog = null;
      showToast(
        alsoDelete
          ? 'Person gelöscht. Mit ↶ kannst du das rückgängig machen.'
          : 'Verbindung entfernt. Mit ↶ kannst du das rückgängig machen.',
      );
    }}
    onclose={closeDialog}
  />
{/if}

{#if toast}<div class="toast" role="status">{toast}</div>{/if}

<style>
  .topbar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    min-height: 60px;
    background: var(--bar-bg);
    border-bottom: 1px solid var(--bar-border);
    flex: none;
    position: relative;
    z-index: 20;
  }
  .proj {
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0;
    padding: 6px 10px;
  }
  .icon-btn {
    background: none;
    border: none;
    font-size: 1.35rem;
    width: 44px;
    height: 44px;
    border-radius: var(--radius);
  }
  .icon-btn:hover:not(:disabled) {
    background: var(--hover);
  }
  .icon-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }
  main {
    flex: 1;
    display: flex;
    min-height: 0;
  }
  .toast {
    position: fixed;
    left: 50%;
    bottom: 70px;
    transform: translateX(-50%);
    z-index: 45;
    background: var(--tip-bg);
    color: var(--tip-ink);
    padding: 12px 18px;
    border-radius: 10px;
    box-shadow: var(--shadow);
    max-width: 560px;
    text-align: center;
  }
</style>
