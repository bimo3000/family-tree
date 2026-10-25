/**
 * The working copy in the browser's built-in database (IndexedDB, DATA-03, architecture §3.2): the
 * open project with its pictures, so edits survive a reload. The `.stammbaum` file stays the real thing.
 * The browser keeps one working copy: opening another project replaces it.
 */
import type { Project } from '../core/model/types';

/** What the app knows about the project's file. Absent fields: not known or not yet. */
export interface FileInfo {
  /** The file last opened or saved, e.g. `Familie Brandt.stammbaum`. */
  name?: string;
  /** ISO timestamp of the last time the project was written to a file. */
  savedAt?: string;
  /** ISO timestamp of the first change that is not in a file yet. Absent: nothing to save. */
  unsavedSince?: string;
}

export interface WorkingCopy {
  project: Project;
  file: FileInfo;
  /** Picture blobs by image ID. */
  images: Map<string, Blob>;
}

const STATE = 'state';
const IMAGES = 'images';
const PROJECT_KEY = 'project';
const HANDLE_KEY = 'handle';
const LANGUAGE_KEY = 'language';

let database: Promise<IDBDatabase> | undefined;

function db(): Promise<IDBDatabase> {
  database ??= new Promise((resolve, reject) => {
    const open = indexedDB.open('stammbaum', 1);
    open.onupgradeneeded = () => {
      open.result.createObjectStore(STATE);
      open.result.createObjectStore(IMAGES);
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error ?? new Error('IndexedDB'));
  });
  return database;
}

/** Runs `work` in one transaction and resolves once it is committed. */
async function transaction(
  mode: IDBTransactionMode,
  work: (state: IDBObjectStore, images: IDBObjectStore) => void,
): Promise<void> {
  const tx = (await db()).transaction([STATE, IMAGES], mode);
  const done = new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(tx.error ?? new Error('IndexedDB'));
  });
  try {
    work(tx.objectStore(STATE), tx.objectStore(IMAGES));
  } catch (error) {
    // E.g. a value the browser can't store: nothing of this transaction is kept.
    done.catch(() => {});
    tx.abort();
    throw error;
  }
  return done;
}

/** The last project, or null on the very first start. Pictures no longer used are cleaned up. */
export async function loadWorkingCopy(): Promise<WorkingCopy | null> {
  let saved: { project: Project; file: FileInfo } | undefined;
  const images = new Map<string, Blob>();
  await transaction('readwrite', (state, store) => {
    const get = state.get(PROJECT_KEY);
    get.onsuccess = () => {
      saved = get.result as typeof saved;
      const used = new Set(saved?.project.images.map((i) => i.id));
      const cursor = store.openCursor();
      cursor.onsuccess = () => {
        const c = cursor.result;
        if (!c) return;
        const id = String(c.key);
        if (used.has(id)) images.set(id, jpeg(c.value as ArrayBuffer));
        else c.delete();
        c.continue();
      };
    };
  });
  return saved ? { ...saved, images } : null;
}

/** Called after every change; the pictures are stored on their own (`putImage`). */
export function saveProject(project: Project, file: FileInfo): Promise<void> {
  return transaction('readwrite', (state) => state.put({ project, file }, PROJECT_KEY));
}

/**
 * Pictures are stored as bytes, not as Blobs: WebKit refuses Blobs in IndexedDB in private windows
 * (and in Playwright's test browser).
 */
export async function putImage(id: string, blob: Blob): Promise<void> {
  const bytes = await blob.arrayBuffer();
  return transaction('readwrite', (_, images) => images.put(bytes, id));
}

/** Another project is opened: it replaces the working copy, pictures included. */
export async function replaceWorkingCopy({ project, file, images }: WorkingCopy): Promise<void> {
  const pictures = await Promise.all(
    [...images].map(async ([id, blob]) => [id, await blob.arrayBuffer()] as const),
  );
  return transaction('readwrite', (state, store) => {
    store.clear();
    for (const [id, bytes] of pictures) store.put(bytes, id);
    state.put({ project, file }, PROJECT_KEY);
    state.delete(HANDLE_KEY);
  });
}

/** The Chromium file handle, so the same file can be written again after a restart (ADR-0005). */
export async function loadHandle(): Promise<FileSystemFileHandle | null> {
  let handle: FileSystemFileHandle | null = null;
  await transaction('readonly', (state) => {
    const get = state.get(HANDLE_KEY);
    get.onsuccess = () => (handle = (get.result as FileSystemFileHandle | undefined) ?? null);
  });
  return handle;
}

/** Best effort: a handle the browser can't store is simply not remembered. */
export async function saveHandle(handle: FileSystemFileHandle | null): Promise<void> {
  try {
    await transaction('readwrite', (state) =>
      handle ? state.put(handle, HANDLE_KEY) : state.delete(HANDLE_KEY),
    );
  } catch {
    // After a restart, "Speichern" then asks for the file again.
  }
}

/** One-time hints the user has already seen. */
export async function hasSeen(hint: string): Promise<boolean> {
  let seen = false;
  await transaction('readonly', (state) => {
    const get = state.get(`seen:${hint}`);
    get.onsuccess = () => (seen = get.result === true);
  });
  return seen;
}

export function markSeen(hint: string): Promise<void> {
  return transaction('readwrite', (state) => state.put(true, `seen:${hint}`));
}

/** The chosen UI language (GEN-05): per browser, not in the project file. Null until one is chosen. */
export async function loadLanguage(): Promise<string | null> {
  let language: string | null = null;
  await transaction('readonly', (state) => {
    const get = state.get(LANGUAGE_KEY);
    get.onsuccess = () => (language = typeof get.result === 'string' ? get.result : null);
  });
  return language;
}

export function saveLanguage(language: string): Promise<void> {
  return transaction('readwrite', (state) => state.put(language, LANGUAGE_KEY));
}

function jpeg(bytes: ArrayBuffer): Blob {
  return new Blob([bytes], { type: 'image/jpeg' });
}
