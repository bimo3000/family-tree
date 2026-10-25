<script lang="ts">
  import type { Person } from '../../core/model/types';
  import { t } from '../i18n/index.svelte';
  import { fullName } from '../text';
  import Modal from './Modal.svelte';

  interface Props {
    person: Person;
    ondelete: () => void;
    onclose: () => void;
  }
  let { person, ondelete, onclose }: Props = $props();

  const title = $derived(t.deleteDialog.title(fullName(person)));
</script>

<!-- ui-concept §2.7 -->
<Modal label={title} {onclose}>
  <h2>{title}</h2>
  <p>{t.deleteDialog.text(person.gender)}</p>
  <div class="form-actions">
    <button type="button" class="btn danger" onclick={ondelete}>{t.deleteDialog.delete}</button>
    <button type="button" class="btn" onclick={onclose}>{t.common.cancel}</button>
  </div>
</Modal>
