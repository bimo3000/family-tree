<script lang="ts">
  import { t } from '../i18n/index.svelte';
  import Modal from './Modal.svelte';

  interface Props {
    onclose: () => void;
  }
  let { onclose }: Props = $props();
</script>

<!-- ui-concept §7: a short help inside the app, no internet needed. -->
<Modal label={t.help.title} wide {onclose}>
  <h2>{t.help.title}</h2>
  <p class="muted">{t.help.intro}</p>
  {#each t.help.sections as section (section.title)}
    <h3>{section.title}</h3>
    <p>{section.text}</p>
  {/each}
  <div class="form-actions">
    <button type="button" class="btn primary" onclick={onclose}>{t.help.close}</button>
  </div>
</Modal>

<style>
  p {
    line-height: 1.5;
    margin: 0.4em 0;
  }
</style>
