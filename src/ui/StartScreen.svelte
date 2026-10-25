<script lang="ts">
  import { t } from './i18n/index.svelte';
  import LanguageChoice from './LanguageChoice.svelte';

  /** Shown when there is no last project (ui-concept §2.1). A file can also be dropped onto it. */
  interface Props {
    onnew: () => void;
    onopen: () => void;
    onexample: () => void;
  }
  let { onnew, onopen, onexample }: Props = $props();
</script>

<main class="start">
  <h1>{t.start.title}</h1>
  <p>{t.start.tagline}</p>
  <button type="button" class="btn primary" onclick={onnew}>{t.start.new}</button>
  <button type="button" class="btn" onclick={onopen}>{t.start.open}</button>
  <button type="button" class="btn" onclick={onexample}>{t.start.example}</button>
  <div class="language"><LanguageChoice /></div>
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
  .language {
    margin-top: 18px;
    font-size: 1.05rem;
  }
  .btn {
    width: 360px;
    max-width: 100%;
    min-height: 60px;
    font-size: 1.15rem;
  }
</style>
