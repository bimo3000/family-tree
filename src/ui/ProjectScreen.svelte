<script lang="ts">
  import { untrack } from 'svelte';
  import { deletePerson, removePhoto, renameProject, updatePerson } from '../core/model/operations';
  import {
    type Relation,
    childLinksOf,
    findPerson,
    isPlaceholder,
    sameRelation,
  } from '../core/model/queries';
  import { removeRelation } from '../core/model/relatives';
  import type { PersonId } from '../core/model/types';
  import type { Crop } from '../core/photoCrop';
  import AddRelativeDialog, { type RelativeKind } from './dialogs/AddRelativeDialog.svelte';
  import DeleteDialog from './dialogs/DeleteDialog.svelte';
  import HelpDialog from './dialogs/HelpDialog.svelte';
  import PersonDialog from './dialogs/PersonDialog.svelte';
  import RelationDialog from './dialogs/RelationDialog.svelte';
  import RemoveRelationDialog from './dialogs/RemoveRelationDialog.svelte';
  import NameDialog from './dialogs/NameDialog.svelte';
  import DetailPanel from './panel/DetailPanel.svelte';
  import { providePhotos } from './photos';
  import { UnreadablePictureError } from '../storage/pictures';
  import { hasSeen, markSeen } from '../storage/workingCopy';
  import { t } from './i18n/index.svelte';
  import type { Editor } from './state/editor.svelte';
  import { reminderDays } from './state/reminder';
  import type { Workspace } from './state/workspace.svelte';
  import { showToast } from './toast.svelte';
  import TreeView from './tree/TreeView.svelte';

  /** The open project (ui-concept §2.2). The menu's file actions are handled by App.svelte. */
  interface Props {
    workspace: Workspace;
    editor: Editor;
    /** A new project: its first person's dialog opens at once. */
    startWith?: PersonId | undefined;
    onnew: () => void;
    onopen: () => void;
    onexample: () => void;
    onsave: (as: boolean) => void;
  }
  let { workspace, editor, startWith, onnew, onopen, onexample, onsave }: Props = $props();

  const project = $derived(editor.project);
  providePhotos((id) => workspace.photoUrl(id));

  async function addPhoto(id: PersonId, file: File, crop?: Crop) {
    try {
      await workspace.addPhoto(id, file, crop);
    } catch (e) {
      showToast(
        e instanceof UnreadablePictureError ? t.project.unreadablePicture : t.project.photoFailed,
      );
    }
  }
  const selected = $derived(editor.selectedId ? findPerson(project, editor.selectedId) : undefined);
  let tree = $state<TreeView>();

  /** At most one dialog is open. Persons and relations are looked up again on every change. */
  type Dialog =
    | { type: 'person'; id: PersonId; isNew?: boolean }
    | { type: 'add'; id: PersonId; kind: RelativeKind }
    | { type: 'delete'; id: PersonId }
    | { type: 'relation'; relation: Relation }
    | { type: 'remove'; relation: Relation }
    | { type: 'rename' }
    | { type: 'help' };
  // Only the first person of a new project opens by itself.
  const first = untrack(() => startWith);
  let dialog = $state<Dialog | null>(first ? { type: 'person', id: first } : null);
  if (first) untrack(() => (editor.selectedId = first));
  let menuOpen = $state(false);

  // Checked once, when the project opens: a long time without saving into a file (UI-02).
  const remindAfter = untrack(() => reminderDays(workspace.file.unsavedSince, new Date()));
  const hadFile = untrack(() => !!workspace.file.name);
  let reminderClosed = $state(false);
  const reminderShown = $derived(!!remindAfter && workspace.unsaved && !reminderClosed);

  // First use: one hint on how to use the tree (ui-concept §7), until closed or a person is selected.
  const TREE_HINT = 'tree-hint';
  let hintShown = $state(false);
  void hasSeen(TREE_HINT).then((seen) => (hintShown = !seen));
  function closeHint() {
    if (!hintShown) return;
    hintShown = false;
    void markSeen(TREE_HINT);
  }
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

  /** Runs a menu entry and closes the menu. */
  function menu(action: () => void) {
    menuOpen = false;
    action();
  }

  function select(id: PersonId | null) {
    editor.selectedId = id;
    if (id) closeHint();
  }

  function goto(id: PersonId) {
    select(id);
    tree?.centre(id);
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && menuOpen) menuOpen = false;
    else if (e.key === 'Escape' && !dialog) select(null);
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

<svelte:window
  {onkeydown}
  onclick={(e) => {
    if (menuOpen && !(e.target as Element).closest('.proj')) menuOpen = false;
  }}
/>

<header class="topbar">
  <div class="proj">
    <h1>
      <button
        type="button"
        class="proj-btn"
        aria-expanded={menuOpen}
        onclick={() => (menuOpen = !menuOpen)}>{project.name}</button
      >
    </h1>
    {#if menuOpen}
      <div class="menu">
        <button type="button" onclick={() => menu(onnew)}>{t.project.new}</button>
        <button type="button" onclick={() => menu(onopen)}>{t.project.open}</button>
        <button type="button" onclick={() => menu(() => onsave(true))}>{t.project.saveAs}</button>
        <button type="button" onclick={() => menu(() => (dialog = { type: 'rename' }))}
          >{t.project.rename}</button
        >
        <hr />
        <button type="button" onclick={() => menu(() => window.print())}>{t.project.print}</button>
        <hr />
        <button type="button" onclick={() => menu(onexample)}>{t.project.example}</button>
        <button type="button" onclick={() => menu(() => (dialog = { type: 'help' }))}
          >{t.project.help}</button
        >
      </div>
    {/if}
  </div>
  <button
    type="button"
    class="icon-btn"
    title={t.project.undoKey}
    aria-label={t.project.undo}
    disabled={!editor.canUndo}
    onclick={() => editor.undo()}>↶</button
  >
  <button
    type="button"
    class="icon-btn"
    title={t.project.redoKey}
    aria-label={t.project.redo}
    disabled={!editor.canRedo}
    onclick={() => editor.redo()}>↷</button
  >
  <div class="spacer"></div>
  {#if workspace.unsaved}
    <span class="status dirty">{t.project.unsaved}</span>
  {:else if workspace.file.name}
    <span class="status">{t.project.saved}</span>
  {/if}
  <button type="button" class="btn primary" onclick={() => onsave(false)}>{t.project.save}</button>
</header>
<p class="print-title">{project.name}</p>
<main>
  {#if reminderShown && remindAfter}
    <div class="note reminder">
      <span>
        {hadFile ? t.project.reminderWithFile(remindAfter) : t.project.reminderNoFile(remindAfter)}
      </span>
      <button type="button" class="btn primary" onclick={() => onsave(false)}
        >{t.common.saveNow}</button
      >
      <button
        type="button"
        class="close"
        title={t.common.hide}
        aria-label={t.common.hide}
        onclick={() => (reminderClosed = true)}>×</button
      >
    </div>
  {:else if hintShown}
    <div class="note hint">
      <span>{t.project.treeHint}</span>
      <button
        type="button"
        class="close"
        title={t.common.hide}
        aria-label={t.common.hide}
        onclick={closeHint}>×</button
      >
    </div>
  {/if}
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
      onphoto={(file, crop) => addPhoto(dialogPerson.id, file, crop)}
      onphotoremove={() => editor.apply((p) => removePhoto(p, dialogPerson.id))}
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
      showToast(t.project.deleted);
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
      showToast(alsoDelete ? t.project.personDeleted : t.project.relationRemoved);
    }}
    onclose={closeDialog}
  />
{:else if dialog?.type === 'help'}
  <HelpDialog onclose={closeDialog} />
{:else if dialog?.type === 'rename'}
  <NameDialog
    title={t.project.renameTitle}
    submit={t.project.rename}
    name={project.name}
    onsubmit={(name) => {
      editor.apply((p) => renameProject(p, name));
      dialog = null;
    }}
    onclose={closeDialog}
  />
{/if}

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
    position: relative;
  }
  h1 {
    margin: 0;
    font-size: inherit;
  }
  .proj-btn {
    font-size: 1.3rem;
    font-weight: 600;
    background: none;
    border: none;
    padding: 6px 10px;
    border-radius: var(--radius);
  }
  /* Drawn by CSS, so the heading reads as just the project name. */
  .proj-btn::after {
    content: ' ▾';
  }
  .proj-btn:hover {
    background: var(--hover);
  }
  .menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 270px;
    background: var(--panel-bg);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 6px;
  }
  .menu button {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 10px 12px;
    border-radius: 6px;
  }
  .menu button:hover {
    background: var(--hover);
  }
  .menu hr {
    border: none;
    border-top: 1px solid var(--line-soft);
    margin: 4px 0;
  }
  .spacer {
    flex: 1;
  }
  .status {
    color: var(--muted);
    margin-right: 10px;
  }
  .status.dirty {
    color: var(--warn);
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
    position: relative;
  }
  /* The backup reminder and the first-use hint share the spot above the tree. */
  .note {
    position: absolute;
    left: 50%;
    top: 16px;
    transform: translateX(-50%);
    z-index: 15;
    display: flex;
    align-items: center;
    gap: 12px;
    /* Without it, the box would wrap at half the width (it starts at left: 50%). */
    width: max-content;
    max-width: calc(100% - 32px);
    padding: 8px 8px 8px 16px;
    background: var(--panel-bg);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
  }
  .hint {
    padding: 6px 6px 6px 16px;
  }
  .note .close {
    background: none;
    border: none;
    font-size: 1.4rem;
    width: 40px;
    height: 40px;
    border-radius: var(--radius);
    color: var(--muted);
  }
  .note .close:hover {
    background: var(--hover);
  }
  .print-title {
    display: none;
  }
  /* Printing (UI-03): only the project name and the tree. */
  @media print {
    .topbar,
    .note,
    main > :global(.panel) {
      display: none;
    }
    .print-title {
      display: block;
      margin: 0 0 12px;
      font-size: 1.3rem;
      font-weight: 600;
    }
    main {
      display: block;
    }
  }
</style>
