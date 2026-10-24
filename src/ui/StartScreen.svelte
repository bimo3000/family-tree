<script lang="ts">
  /** Shown when there is no last project (ui-concept §2.1). A file can also be dropped onto it. */
  interface Props {
    onnew: () => void;
    onopen: () => void;
    onexample: () => void;
  }
  let { onnew, onopen, onexample }: Props = $props();
</script>

<main class="start">
  <h1>Stammbaum</h1>
  <p>Deine Familiengeschichte, privat auf deinem Computer.</p>
  <button type="button" class="btn primary" onclick={onnew}>Neuen Stammbaum anlegen</button>
  <button type="button" class="btn" onclick={onopen}>Stammbaum-Datei öffnen</button>
  <button type="button" class="btn" onclick={onexample}>Beispiel ansehen</button>
</main>

<style>
  .start {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    text-align: center;
    padding: 20px;
  }
  h1 {
    font-size: 2.6rem;
    font-style: italic;
    margin: 0;
  }
  p {
    margin: 0 0 18px;
    color: var(--muted);
    font-size: 1.1rem;
  }
  .btn {
    width: 360px;
    max-width: 100%;
    min-height: 60px;
    font-size: 1.15rem;
  }
</style>
