<script lang="ts">
  import { parseDate } from '../../core/dates';
  import { t } from '../i18n/index.svelte';
  import { dateHint } from '../text';

  interface Props {
    label: string;
    value: string;
    oninput: (value: string) => void;
  }
  let { label, value, oninput }: Props = $props();

  const parsed = $derived(parseDate(value));
</script>

<!-- A plain text field with the live interpretation underneath (ui-concept §2.5, PERS-06). -->
<div>
  <label>
    {label}
    <input
      type="text"
      {value}
      oninput={(e) => oninput(e.currentTarget.value)}
      placeholder={t.dates.placeholder}
    />
  </label>
  <div class="date-hint" class:vague={parsed && 'text' in parsed}>{dateHint(parsed)}</div>
</div>
