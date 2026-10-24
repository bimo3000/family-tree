/**
 * Opening and saving `.stammbaum` files (DATA-09, architecture §3.3, ADR-0005). Chrome and Edge can
 * write straight into a file the user picked (File System Access); Firefox and Safari download it.
 * Chosen by feature detection, never by browser name.
 */
import { PROJECT_FILE_EXTENSION } from '../core/app-info';

interface PickerOptions {
  types: { description: string; accept: Record<string, string[]> }[];
  suggestedName?: string;
}

/** The parts of the File System Access API that TypeScript's DOM types don't include yet. */
interface Pickers {
  showOpenFilePicker(options: PickerOptions): Promise<FileSystemFileHandle[]>;
  showSaveFilePicker(options: PickerOptions): Promise<FileSystemFileHandle>;
}
interface PermissionHandle {
  queryPermission(options: { mode: 'readwrite' }): Promise<PermissionState>;
  requestPermission(options: { mode: 'readwrite' }): Promise<PermissionState>;
}

const TYPES = [
  { description: 'Stammbaum', accept: { 'application/x-stammbaum': [PROJECT_FILE_EXTENSION] } },
];

const pickers = (): Partial<Pickers> => window as Partial<Pickers>;

/** Chrome/Edge: saving writes into the file itself. Elsewhere, saving downloads the file. */
export function canSaveInPlace(): boolean {
  return typeof pickers().showSaveFilePicker === 'function';
}

export function canOpenWithHandle(): boolean {
  return typeof pickers().showOpenFilePicker === 'function';
}

/** Chrome/Edge open picker. Null if the user cancels. */
export async function pickFileToOpen(): Promise<FileSystemFileHandle | null> {
  try {
    const [handle] = await pickers().showOpenFilePicker!({ types: TYPES });
    return handle ?? null;
  } catch (error) {
    if (isAbort(error)) return null;
    throw error;
  }
}

/** Chrome/Edge "Speichern unter" picker. Null if the user cancels. */
export async function pickFileToSave(suggestedName: string): Promise<FileSystemFileHandle | null> {
  try {
    return await pickers().showSaveFilePicker!({ types: TYPES, suggestedName });
  } catch (error) {
    if (isAbort(error)) return null;
    throw error;
  }
}

/**
 * May the app write into this file? `ask` shows the browser's permission question, which only
 * works right after a click. After a restart the browser asks once again ("Erlaubnis erneuern").
 */
export async function mayWrite(handle: FileSystemFileHandle, ask: boolean): Promise<boolean> {
  const h = handle as FileSystemFileHandle & Partial<PermissionHandle>;
  if (!h.queryPermission) return true;
  if ((await h.queryPermission({ mode: 'readwrite' })) === 'granted') return true;
  return ask && h.requestPermission
    ? (await h.requestPermission({ mode: 'readwrite' })) === 'granted'
    : false;
}

export async function writeFile(handle: FileSystemFileHandle, bytes: Uint8Array): Promise<void> {
  const stream = await handle.createWritable();
  await stream.write(bytes as Uint8Array<ArrayBuffer>);
  await stream.close();
}

/** Firefox/Safari: the browser saves the file into the download folder. */
export function download(bytes: Uint8Array, fileName: string): void {
  const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>]));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  // Give the browser time to start the download before the URL goes away.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** `Familie Müller.stammbaum`, without characters that file systems refuse. */
export function fileNameFor(projectName: string): string {
  const base =
    projectName
      .replace(/[\\/:*?"<>|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || 'Stammbaum';
  return base + PROJECT_FILE_EXTENSION;
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
