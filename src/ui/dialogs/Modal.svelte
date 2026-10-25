<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** Read out by screen readers and used by the E2E tests to find the dialog. */
    label: string;
    wide?: boolean;
    onclose: () => void;
    children: Snippet;
  }
  let { label, wide = false, onclose, children }: Props = $props();

  let dialog: HTMLDialogElement;
  // A press that started inside (e.g. selecting text in a field) and ended outside is not a click outside.
  let pressedOutside = false;

  // The native modal dialog keeps the focus inside and closes on Esc in every engine.
  $effect(() => {
    dialog.showModal();
    // Focus the first field instead of the first button. Without a field, the browser focuses the first
    // button, which may sit at the end of a long text: start reading at the top anyway.
    const field = dialog.querySelector<HTMLElement>('input[type="text"], textarea');
    if (field) field.focus();
    else dialog.scrollTop = 0;
  });
</script>

<!-- The click handler only notices clicks on the dimmed background around the dialog;
     by keyboard, Esc closes it (the native "cancel" event). -->
<dialog
  bind:this={dialog}
  class="modal"
  class:wide
  aria-label={label}
  oncancel={(e) => {
    e.preventDefault();
    onclose();
  }}
  onkeydown={(e) => {
    // Enter in a field presses the highlighted button („Fertig“, „Hinzufügen“). Not in a text area (new
    // line), on a button (it presses itself), in a select (an open list) or in a form (it submits itself).
    const target = e.target as HTMLElement;
    if (e.key !== 'Enter' || e.isComposing || !target.matches('input') || target.closest('form'))
      return;
    const primary = dialog.querySelector<HTMLButtonElement>('.btn.primary:not(:disabled)');
    if (!primary) return;
    e.preventDefault();
    primary.click();
  }}
  onpointerdown={(e) => (pressedOutside = e.target === dialog)}
  onclick={(e) => {
    if (e.target === dialog && pressedOutside) onclose();
  }}
>
  <div class="body">
    {@render children()}
  </div>
</dialog>

<style>
  /* The padding sits on the inner box, so a click on the dialog element itself is a click outside. */
  dialog {
    padding: 0;
  }
  .body {
    padding: 22px 28px 26px;
  }
</style>
