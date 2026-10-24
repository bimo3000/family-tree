<script lang="ts">
  import type { Person } from '../../core/model/types';
  import { fullName, possessive } from '../text';
  import Modal from './Modal.svelte';

  interface Props {
    person: Person;
    ondelete: () => void;
    onclose: () => void;
  }
  let { person, ondelete, onclose }: Props = $props();

  const title = $derived(`${fullName(person)} wirklich löschen?`);
</script>

<!-- ui-concept §2.7 -->
<Modal label={title} {onclose}>
  <h2>{title}</h2>
  <p>
    {possessive(person)} Verbindungen zu anderen Personen werden entfernt. Du kannst das mit ↶ rückgängig
    machen.
  </p>
  <div class="form-actions">
    <button type="button" class="btn danger" onclick={ondelete}>Löschen</button>
    <button type="button" class="btn" onclick={onclose}>Abbrechen</button>
  </div>
</Modal>
