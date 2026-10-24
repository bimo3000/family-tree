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
    // Focus the first field instead of the first button.
    dialog.querySelector<HTMLElement>('input[type="text"], textarea')?.focus();
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
