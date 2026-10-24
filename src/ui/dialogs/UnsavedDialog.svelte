<script lang="ts">
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

<Modal label="Noch nicht gespeichert" {onclose}>
  <h2>Noch nicht gespeichert</h2>
  <p>
    {hasFile
      ? 'Deine letzten Änderungen sind noch nicht in der Datei gespeichert.'
      : 'Dieser Stammbaum ist noch nicht in einer Datei gespeichert.'}
  </p>
  <div class="form-actions">
    <button type="button" class="btn primary" onclick={onsave}>Jetzt speichern</button>
    <button type="button" class="btn" onclick={ondiscard}>Ohne Speichern weiter</button>
    <button type="button" class="btn" onclick={onclose}>Abbrechen</button>
  </div>
</Modal>
