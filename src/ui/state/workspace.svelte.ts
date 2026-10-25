/**
 * The open project together with its file and its working copy (architecture §2 "state", §3):
 * every change goes into the browser at once (DATA-03), the save status (UI-02), and saving into
 * the file (DATA-09). The UI only calls these methods; storage details stay in src/storage/.
 */
/* eslint-disable svelte/prefer-svelte-reactivity -- the picture maps and timestamps are not shown directly */
import { APP_VERSION } from '../../core/app-info';
import { setPhoto } from '../../core/model/operations';
import { newId } from '../../core/model/project';
import type { PersonId, Project } from '../../core/model/types';
import type { Crop } from '../../core/photoCrop';
import {
  canSaveInPlace,
  download,
  fileNameFor,
  mayWrite,
  pickFileToSave,
  writeFile,
} from '../../storage/files';
import { latestOnly } from '../../storage/latest';
import { preparePicture } from '../../storage/pictures';
import { packProject, unpackProject } from '../../storage/projectFile';
import * as workingCopy from '../../storage/workingCopy';
import type { FileInfo } from '../../storage/workingCopy';
import { Editor } from './editor.svelte';

/** Chrome/Edge: changes go into the file after this pause. Files with photos can be big. */
const WRITE_DELAY_MS = 2000;

export type SaveResult = 'saved' | 'downloaded' | 'cancelled';

export class Workspace {
  /** Null: no project yet, the start screen shows. A new editor for every opened project. */
  editor: Editor | null = $state.raw(null);
  file: FileInfo = $state.raw({});
  /** Set when saving went wrong in the background; the UI shows it and clears it. */
  problem: 'working-copy' | 'file' | null = $state(null);

  /** Pictures by image ID. Kept for the whole session, so undoing a photo change always works. */
  #images = new Map<string, Blob>();
  #urls = new Map<string, string>();
  #handle: FileSystemFileHandle | null = null;
  /** Chrome/Edge with permission: every change is written into the file. */
  #writesToFile = false;
  #writeTimer: ReturnType<typeof setTimeout> | undefined;
  /** Counts opened projects: a late autosave of the previous one must not overwrite the new one. */
  #generation = 0;

  #persist = latestOnly(
    async ({
      project,
      file,
      generation,
    }: {
      project: Project;
      file: FileInfo;
      generation: number;
    }) => {
      if (generation === this.#generation) await workingCopy.saveProject(project, file);
    },
    () => (this.problem = 'working-copy'),
  );
  #writeLater = latestOnly(
    () => this.#writeToFile(),
    () => {
      this.#writesToFile = false;
      this.problem = 'file';
    },
  );

  /** Changes that are not in a file yet ("Nicht in Datei gespeichert"). */
  get unsaved(): boolean {
    return this.file.unsavedSince !== undefined;
  }

  /** Reopens the last project (DATA-03). Without one, `editor` stays null. */
  async start(): Promise<void> {
    const copy = await workingCopy.loadWorkingCopy();
    if (!copy) return;
    const handle = await workingCopy.loadHandle();
    await this.#show(copy.project, copy.images, copy.file, handle);
  }

  /** Replaces the open project and the working copy. */
  async open(
    project: Project,
    images = new Map<string, Blob>(),
    file: FileInfo = {},
    handle: FileSystemFileHandle | null = null,
  ): Promise<void> {
    this.#generation++;
    try {
      await workingCopy.replaceWorkingCopy({ project, file, images });
      if (handle) await workingCopy.saveHandle(handle);
    } catch {
      // The browser refuses its database: the project still opens, it just isn't kept there.
      this.problem = 'working-copy';
    }
    await this.#show(project, images, file, handle);
  }

  /** "Speichern": into the known file if allowed, else like "Speichern unter". */
  async save(): Promise<SaveResult> {
    if (this.#handle && (await mayWrite(this.#handle, true))) {
      try {
        this.#writesToFile = true;
        await this.#writeToFile();
        return 'saved';
      } catch {
        // The file was moved, renamed or deleted, or its stick is gone: ask for a file again.
        this.#handle = null;
        this.#writesToFile = false;
        await workingCopy.saveHandle(null);
      }
    }
    return this.saveAs();
  }

  /** "Speichern unter": Chrome/Edge ask for a file and keep writing into it; elsewhere a download. */
  async saveAs(): Promise<SaveResult> {
    const project = this.#project();
    const name = fileNameFor(project.name);
    if (!canSaveInPlace()) {
      download(await this.#pack(project), name);
      this.#saved(project, name);
      return 'downloaded';
    }
    const handle = await pickFileToSave(name);
    if (!handle) return 'cancelled';
    this.#handle = handle;
    this.#writesToFile = true;
    await workingCopy.saveHandle(handle);
    await this.#writeToFile();
    return 'saved';
  }

  /** PERS-03, PERS-08, DATA-07. Throws UnreadablePictureError for pictures the browser can't read. */
  async addPhoto(personId: PersonId, file: Blob, crop?: Crop): Promise<void> {
    const { blob, width, height } = await preparePicture(file, crop);
    const id = newId('img');
    await workingCopy.putImage(id, blob);
    this.#images.set(id, blob);
    this.editor?.apply((p) =>
      setPhoto(p, personId, { id, file: `bilder/${id}.jpg`, width, height }),
    );
  }

  photoUrl(photoId: string | undefined): string | undefined {
    if (!photoId) return undefined;
    let url = this.#urls.get(photoId);
    const blob = this.#images.get(photoId);
    if (!url && blob) {
      url = URL.createObjectURL(blob);
      this.#urls.set(photoId, url);
    }
    return url;
  }

  async #show(
    project: Project,
    images: Map<string, Blob>,
    file: FileInfo,
    handle: FileSystemFileHandle | null,
  ): Promise<void> {
    clearTimeout(this.#writeTimer);
    for (const url of this.#urls.values()) URL.revokeObjectURL(url);
    this.#urls.clear();
    this.#images = images;
    this.#handle = handle;
    this.#writesToFile = handle ? await mayWrite(handle, false) : false;
    this.file = file;
    this.editor = new Editor(project, (p) => this.#changed(p));
  }

  #changed(project: Project): void {
    if (!this.unsaved) this.file = { ...this.file, unsavedSince: new Date().toISOString() };
    this.#persist({ project, file: this.file, generation: this.#generation });
    if (this.#writesToFile) {
      clearTimeout(this.#writeTimer);
      this.#writeTimer = setTimeout(() => this.#writeLater(undefined), WRITE_DELAY_MS);
    }
  }

  async #writeToFile(): Promise<void> {
    clearTimeout(this.#writeTimer);
    const handle = this.#handle;
    if (!handle) return;
    const project = this.#project();
    await writeFile(handle, await this.#pack(project));
    this.#saved(project, handle.name);
  }

  /** The file now holds `project`. Changes made while writing stay unsaved. */
  #saved(project: Project, name: string): void {
    const savedAt = new Date().toISOString();
    const current = this.#project();
    this.file = current === project ? { name, savedAt } : { ...this.file, name, savedAt };
    this.#persist({ project: current, file: this.file, generation: this.#generation });
  }

  async #pack(project: Project): Promise<Uint8Array> {
    const images = new Map<string, Uint8Array>();
    for (const ref of project.images) {
      const blob = this.#images.get(ref.id);
      if (blob) images.set(ref.id, new Uint8Array(await blob.arrayBuffer()));
    }
    return packProject(project, images, APP_VERSION);
  }

  #project(): Project {
    if (!this.editor) throw new Error('No open project');
    return this.editor.project;
  }
}

/** Reads a `.stammbaum` file. Throws a ModelError if it is not a readable project. */
export async function readProjectFile(
  file: File,
): Promise<{ project: Project; images: Map<string, Blob> }> {
  const { project, images } = unpackProject(new Uint8Array(await file.arrayBuffer()));
  return { project, images: new Map([...images].map(([id, bytes]) => [id, jpeg(bytes)])) };
}

function jpeg(bytes: Uint8Array): Blob {
  return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' });
}
