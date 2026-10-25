<script lang="ts">
  import { t } from '../i18n/index.svelte';
  import Modal from './Modal.svelte';

  /** Before another project replaces one with changes that are not in a file (decided 2026-10-24). */
  interface Props {
    /** The project has a file, only the latest changes are missing from it. */
    hasFile: boolean;
    onsave: () => void;
    ondiscard: () => void;
    onclose: () => void;
  }
  let { hasFile, onsave, ondiscard, onclose }: Props = $props();
</script>

<Modal label={t.unsaved.title} {onclose}>
  <h2>{t.unsaved.title}</h2>
  <p>{hasFile ? t.unsaved.withFile : t.unsaved.noFile}</p>
  <div class="form-actions">
    <button type="button" class="btn primary" onclick={onsave}>{t.common.saveNow}</button>
    <button type="button" class="btn" onclick={ondiscard}>{t.unsaved.discard}</button>
    <button type="button" class="btn" onclick={onclose}>{t.common.cancel}</button>
  </div>
</Modal>
