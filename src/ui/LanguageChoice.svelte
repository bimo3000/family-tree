<script lang="ts">
  import { chooseLanguage, language, LANGUAGES, t } from './i18n/index.svelte';

  /** The language choice on the start screen and in the project menu (GEN-05). */
  interface Props {
    onchoose?: () => void;
  }
  let { onchoose }: Props = $props();
</script>

<div class="languages" role="group" aria-label={t.language}>
  {#each LANGUAGES as { code, name }, i (code)}
    {#if i}<span class="sep" aria-hidden="true">|</span>{/if}
    <button
      type="button"
      class="link"
      class:current={code === language()}
      aria-pressed={code === language()}
      lang={code}
      onclick={() => {
        chooseLanguage(code);
        onchoose?.();
      }}>{name}</button
    >
  {/each}
</div>

<style>
  .languages {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
  .sep {
    color: var(--muted);
  }
  .current {
    color: var(--ink);
    font-weight: 600;
    text-decoration: none;
  }
</style>
