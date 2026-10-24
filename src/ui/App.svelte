<script lang="ts">
  import { PROJECT_FILE_EXTENSION } from '../core/app-info';
  import { addPerson } from '../core/model/operations';
  import { createProject } from '../core/model/project';
  import type { PersonId } from '../core/model/types';
  import { ModelError } from '../core/model/validation';
  import { canOpenWithHandle, pickFileToOpen } from '../storage/files';
  import { hasSeen, markSeen } from '../storage/workingCopy';
  import Modal from './dialogs/Modal.svelte';
  import NameDialog from './dialogs/NameDialog.svelte';
  import UnsavedDialog from './dialogs/UnsavedDialog.svelte';
  import { loadExample } from './example';
  import ProjectScreen from './ProjectScreen.svelte';
  import StartScreen from './StartScreen.svelte';
  import { readProjectFile, Workspace } from './state/workspace.svelte';
  import { showToast, toast } from './toast.svelte';

  const DOWNLOAD_HINT = 'download';

  const workspace = new Workspace();
  let ready = $state(false);
  workspace
    .start()
    .catch(() => showToast('Der Browser lässt das Speichern einer Arbeitskopie nicht zu.'))
    .finally(() => (ready = true));

  /** A new project opens straight into its first person. */
  let startWith = $state<PersonId>();

  type Then = () => Promise<void>;
  type Dialog =
    | { type: 'new' }
    | { type: 'unsaved'; then: Then }
    | { type: 'downloaded'; then: Then | undefined };
  let dialog = $state<Dialog | null>(null);
  let fileInput: HTMLInputElement;

  $effect(() => {
    if (workspace.problem === 'working-copy')
      showToast('Deine Änderungen konnten im Browser nicht gesichert werden. Bitte speichere sie.');
    else if (workspace.problem === 'file')
      showToast('Die Datei konnte nicht geschrieben werden. Klick auf Speichern.');
    workspace.problem = null;
  });

  /** Before another project replaces one with changes that are not in a file, ask first. */
  function leave(then: Then) {
    if (workspace.editor && workspace.unsaved) dialog = { type: 'unsaved', then };
    else void then();
  }

  async function save(as: boolean, then?: Then) {
    let result;
    try {
      result = as ? await workspace.saveAs() : await workspace.save();
    } catch {
      showToast('Das Speichern hat nicht geklappt. Bitte versuch es noch einmal.');
      return;
    }
    if (result === 'cancelled') return;
    // Firefox and Safari download the file: explain that once (DATA-09).
    if (result === 'downloaded' && !(await hasSeen(DOWNLOAD_HINT))) {
      await markSeen(DOWNLOAD_HINT);
      dialog = { type: 'downloaded', then };
    } else if (then) await then();
  }

  /** Closes the dialog and hands over what was to happen after it. */
  function next(): Then | undefined {
    const then = dialog && 'then' in dialog ? dialog.then : undefined;
    dialog = null;
    return then;
  }

  function newProject() {
    leave(async () => {
      dialog = { type: 'new' };
    });
  }

  function example() {
    leave(async () => {
      dialog = null;
      startWith = undefined;
      await workspace.open(loadExample());
    });
  }

  async function openFile() {
    if (!canOpenWithHandle()) return fileInput.click();
    try {
      const handle = await pickFileToOpen();
      if (handle) await read(await handle.getFile(), handle);
    } catch {
      showToast('Die Datei konnte nicht geöffnet werden.');
    }
  }

  /** The file is read first, so a wrong file changes nothing. */
  async function read(file: File, handle: FileSystemFileHandle | null) {
    let content;
    try {
      content = await readProjectFile(file);
    } catch (e) {
      showToast(fileError(e));
      return;
    }
    const { project, images } = content;
    leave(async () => {
      dialog = null;
      startWith = undefined;
      await workspace.open(project, images, { name: file.name }, handle);
    });
  }

  function fileError(e: unknown): string {
    const code = e instanceof ModelError ? e.code : 'invalid';
    if (code === 'not-a-project') return 'Diese Datei ist keine Stammbaum-Datei.';
    if (code === 'newer-version')
      return 'Diese Datei wurde mit einer neueren Version von Stammbaum erstellt. Bitte nimm die neueste Stammbaum.html.';
    return 'Diese Datei ist beschädigt und kann nicht geöffnet werden.';
  }

  /** A `.stammbaum` file dropped anywhere onto the window opens (ui-concept §2.1). */
  function ondragover(e: DragEvent) {
    if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
  }
  function ondrop(e: DragEvent) {
    const file = e.dataTransfer?.files[0];
    if (!file) return;
    e.preventDefault();
    void read(file, null);
  }
</script>

<!-- Closing the tab while changes are not in a file: the browser asks "Seite verlassen?" (ui-concept §4).
     The working copy is safe anyway. -->
<svelte:window
  {ondragover}
  {ondrop}
  onbeforeunload={(e) => {
    if (workspace.unsaved) e.preventDefault();
  }}
/>

{#if ready}
  {#if workspace.editor}
    {#key workspace.editor}
      <ProjectScreen
        {workspace}
        editor={workspace.editor}
        {startWith}
        onnew={newProject}
        onopen={openFile}
        onexample={example}
        onsave={(as) => save(as)}
      />
    {/key}
  {:else}
    <StartScreen onnew={newProject} onopen={openFile} onexample={example} />
  {/if}
{/if}

<input
  bind:this={fileInput}
  type="file"
  accept={PROJECT_FILE_EXTENSION}
  hidden
  onchange={() => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (file) void read(file, null);
  }}
/>

{#if dialog?.type === 'new'}
  <NameDialog
    title="Neuer Stammbaum"
    submit="Anlegen"
    onsubmit={(name) => {
      // A new project starts with one empty person, whose dialog opens at once.
      const { project, id } = addPerson(createProject(name, new Date()));
      dialog = null;
      startWith = id;
      void workspace.open(project);
    }}
    onclose={() => (dialog = null)}
  />
{:else if dialog?.type === 'unsaved'}
  <UnsavedDialog
    hasFile={!!workspace.file.name}
    onsave={() => save(false, next())}
    ondiscard={() => void next()?.()}
    onclose={() => (dialog = null)}
  />
{:else if dialog?.type === 'downloaded'}
  {@const close = () => void next()?.()}
  <Modal label="Gespeichert" onclose={close}>
    <h2>Gespeichert</h2>
    <p>Die Datei liegt jetzt in deinem Download-Ordner. Bewahre sie gut auf.</p>
    <p>
      Dein Browser legt bei jedem Speichern eine neue Datei an. Zum Weitermachen öffnest du am
      besten immer die neueste.
    </p>
    <div class="form-actions">
      <button type="button" class="btn primary" onclick={close}>Verstanden</button>
    </div>
  </Modal>
{/if}

{#if toast.text}<div class="toast" role="status">{toast.text}</div>{/if}

<style>
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
