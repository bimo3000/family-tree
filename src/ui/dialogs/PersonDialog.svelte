<script lang="ts">
  import { untrack } from 'svelte';
  import { isPlaceholder } from '../../core/model/queries';
  import type { ExtraField, Gender, Person } from '../../core/model/types';
  import type { Crop } from '../../core/photoCrop';
  import { t } from '../i18n/index.svelte';
  import { usePhotos } from '../photos';
  import { fmtDate, initials } from '../text';
  import DateField from './DateField.svelte';
  import { lifeEvent } from './fields';
  import Modal from './Modal.svelte';
  import PhotoCropper from './PhotoCropper.svelte';

  interface Props {
    person: Person;
    /** Every input is applied at once. `key` merges the typing in one field into one undo step. */
    onchange: (person: Person, key: string) => void;
    /** A field got the focus: the next input starts a new undo step. */
    onfocus: () => void;
    /** A picture file was chosen (PERS-03), with the part to keep (PERS-08). */
    onphoto: (file: File, crop?: Crop) => void;
    onphotoremove: () => void;
    onclose: () => void;
  }
  let { person, onchange, onfocus, onphoto, onphotoremove, onclose }: Props = $props();

  const photoUrl = usePhotos();
  let photoInput = $state<HTMLInputElement>();
  /** A chosen picture: the dialog shows the crop view until it is taken or cancelled. */
  let cropping = $state<File>();

  /** Without a crop (a picture the browser can't show), storing it brings the usual message. */
  function takePhoto(crop?: Crop) {
    // Read before closing the crop view: a `{@const}` in the markup would already be undefined here.
    const file = cropping;
    cropping = undefined;
    if (file) onphoto(file, crop);
  }

  // The fields as typed. They are filled once; after undo/redo the whole dialog is rebuilt (App.svelte).
  const start = untrack(() => person);
  const isNew = isPlaceholder(start);
  const title = $derived(isNew ? t.personDialog.newTitle : t.personDialog.editTitle);
  const f = $state({
    givenNames: start.givenNames ?? '',
    surname: start.surname ?? '',
    birthName: start.birthName ?? '',
    birthDate: fmtDate(start.birth?.date),
    birthPlace: start.birth?.place ?? '',
    deathDate: fmtDate(start.death?.date),
    deathPlace: start.death?.place ?? '',
    deceased: !!start.deceased,
    gender: start.gender ?? '',
    occupation: start.occupation ?? '',
    residences: start.residences ?? '',
    biography: start.biography ?? '',
    extras: (start.extraFields ?? []).map((e) => ({ ...e })),
  });
  /** Open from the start if any of its fields is filled; afterwards only the user opens or closes it. */
  let moreOpen = $state(
    !!(f.gender || f.occupation || f.residences || f.biography || f.extras.length),
  );

  /** The person as the fields describe it. Empty values are dropped by the core operation. */
  function current(): Person {
    const extraFields: ExtraField[] = f.extras
      .map((e) => ({ label: e.label.trim(), value: e.value.trim() }))
      .filter((e) => e.label || e.value);
    return {
      // The photo is changed on its own, so it comes from the current version.
      ...(person.photoId ? { photoId: person.photoId } : {}),
      id: start.id,
      givenNames: f.givenNames.trim(),
      surname: f.surname.trim(),
      birthName: f.birthName.trim(),
      birth: lifeEvent(f.birthDate, f.birthPlace),
      death: lifeEvent(f.deathDate, f.deathPlace),
      deceased: f.deceased,
      ...(f.gender ? { gender: f.gender as Gender } : {}),
      occupation: f.occupation.trim(),
      residences: f.residences.trim(),
      biography: f.biography.trim(),
      extraFields,
    };
  }

  function apply(key: string) {
    onchange(current(), `person:${start.id}:${key}`);
  }

  type TextField = Exclude<keyof typeof f, 'deceased' | 'extras'>;
  function input(name: TextField) {
    return (
      e: Event & { currentTarget: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement },
    ) => {
      f[name] = e.currentTarget.value;
      apply(name);
    };
  }

  function extraInput(i: number, part: 'label' | 'value') {
    return (e: Event & { currentTarget: HTMLInputElement }) => {
      const extra = f.extras[i];
      if (!extra) return;
      extra[part] = e.currentTarget.value;
      apply(`extra${i}`);
    };
  }

  function addExtra() {
    f.extras.push({ label: '', value: '' });
  }

  function removeExtra(i: number) {
    f.extras.splice(i, 1);
    onfocus();
    apply('extras');
  }
</script>

<Modal
  label={cropping ? t.crop.title : title}
  wide
  onclose={cropping ? () => (cropping = undefined) : onclose}
>
  {#if cropping}
    <PhotoCropper
      file={cropping}
      onconfirm={takePhoto}
      oncancel={() => (cropping = undefined)}
      onunreadable={() => takePhoto()}
    />
  {:else}
    <h2>{title}</h2>
    <div class="form" onfocusin={onfocus}>
      <div class="photo-row">
        <div class="f-photo">
          {#if photoUrl(person.photoId)}
            <img src={photoUrl(person.photoId)} alt="" />
          {:else}
            {initials(person)}
          {/if}
        </div>
        <button type="button" class="btn" onclick={() => photoInput?.click()}
          >{t.personDialog.choosePhoto}</button
        >
        {#if person.photoId}
          <button type="button" class="link" onclick={onphotoremove}
            >{t.personDialog.removePhoto}</button
          >
        {/if}
        <input
          bind:this={photoInput}
          type="file"
          accept="image/*"
          aria-label={t.personDialog.photo}
          hidden
          onchange={(e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = '';
            if (file) cropping = file;
          }}
        />
      </div>
      <label>
        {t.personDialog.givenNames}
        <input
          type="text"
          value={f.givenNames}
          oninput={input('givenNames')}
          placeholder={t.personDialog.givenNamesExample}
        />
      </label>
      <label>
        {t.personDialog.surname}
        <input type="text" value={f.surname} oninput={input('surname')} />
      </label>
      <label>
        {t.personDialog.birthName}
        <input type="text" value={f.birthName} oninput={input('birthName')} />
      </label>
      <div class="pair">
        <DateField
          label={t.personDialog.born}
          value={f.birthDate}
          oninput={(v) => {
            f.birthDate = v;
            apply('birthDate');
          }}
        />
        <label>
          {t.personDialog.place}
          <input type="text" value={f.birthPlace} oninput={input('birthPlace')} />
        </label>
      </div>
      <div class="pair">
        <DateField
          label={t.personDialog.died}
          value={f.deathDate}
          oninput={(v) => {
            f.deathDate = v;
            apply('deathDate');
          }}
        />
        <label>
          {t.personDialog.place}
          <input type="text" value={f.deathPlace} oninput={input('deathPlace')} />
        </label>
      </div>
      <label class="check">
        <input
          type="checkbox"
          checked={f.deceased}
          onchange={(e) => {
            f.deceased = e.currentTarget.checked;
            apply('deceased');
          }}
        />
        {t.personDialog.deceased}
      </label>

      <details bind:open={moreOpen}>
        <summary>{t.personDialog.more}</summary>
        <label>
          {t.personDialog.gender}
          <select value={f.gender} onchange={input('gender')}>
            {#each Object.entries(t.personDialog.genders) as [value, label] (value)}
              <option {value}>{label}</option>
            {/each}
          </select>
        </label>
        <label>
          {t.personDialog.occupation}
          <input type="text" value={f.occupation} oninput={input('occupation')} />
        </label>
        <label>
          {t.personDialog.residences}
          <input
            type="text"
            value={f.residences}
            oninput={input('residences')}
            placeholder={t.personDialog.residencesExample}
          />
        </label>
        <label>
          {t.personDialog.biography}
          <textarea rows="6" value={f.biography} oninput={input('biography')}></textarea>
        </label>
        <div class="extras-title">{t.personDialog.extras}</div>
        {#each f.extras as extra, i (i)}
          <div class="extra-row">
            <input
              type="text"
              aria-label={t.personDialog.extraLabel}
              value={extra.label}
              oninput={extraInput(i, 'label')}
              placeholder={t.personDialog.extraLabelExample}
            />
            <input
              type="text"
              aria-label={t.personDialog.extraValue}
              value={extra.value}
              oninput={extraInput(i, 'value')}
              placeholder={t.personDialog.extraValueExample}
            />
            <button
              type="button"
              class="link danger"
              title={t.personDialog.removeField}
              onclick={() => removeExtra(i)}>×</button
            >
          </div>
        {/each}
        <button type="button" class="link" onclick={addExtra}>{t.personDialog.addField}</button>
      </details>
    </div>
    <div class="form-actions">
      <button type="button" class="btn primary" onclick={onclose}>{t.common.done}</button>
    </div>
    <p class="muted small">{t.personDialog.instant}</p>
  {/if}
</Modal>

<style>
  .photo-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .f-photo {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--ph-bg);
    color: var(--ph-ink);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    flex: none;
  }
  .f-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .extras-title {
    margin: 12px 0 0;
    color: var(--muted);
    font-size: 0.92rem;
  }
  .extra-row {
    display: grid;
    grid-template-columns: 1fr 1.4fr auto;
    gap: 6px;
    align-items: center;
    margin-top: 6px;
  }
  .extra-row input[type='text'] {
    margin-top: 0;
  }
</style>
