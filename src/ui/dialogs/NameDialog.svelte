<script lang="ts">
  import { untrack } from 'svelte';
  import { t } from '../i18n/index.svelte';
  import Modal from './Modal.svelte';

  /** Asks for a project name: for a new project and for "Umbenennen". */
  interface Props {
    title: string;
    submit: string;
    name?: string;
    onsubmit: (name: string) => void;
    onclose: () => void;
  }
  let { title, submit, name = '', onsubmit, onclose }: Props = $props();

  // The field starts with the current name.
  let value = $state(untrack(() => name));
</script>

<Modal label={title} {onclose}>
  <form
    class="form"
    onsubmit={(e) => {
      e.preventDefault();
      if (value.trim()) onsubmit(value.trim());
    }}
  >
    <h2>{title}</h2>
    <label>
      {t.nameDialog.name}
      <input type="text" bind:value placeholder={t.nameDialog.example} />
    </label>
    <div class="form-actions">
      <button type="submit" class="btn primary" disabled={!value.trim()}>{submit}</button>
      <button type="button" class="btn" onclick={onclose}>{t.common.cancel}</button>
    </div>
  </form>
</Modal>
