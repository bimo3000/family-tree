/**
 * The project file `Name.stammbaum` (DATA-04, ADR-0005): a zip with `data.json` and one JPEG per
 * picture in `bilder/`. Pictures are already compressed, so they are stored as they are.
 */
import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate';
import type { Project } from '../core/model/types';
import { ModelError } from '../core/model/validation';
import { projectFromJson, projectToJson } from '../core/serialization';

const DATA_FILE = 'data.json';

/** Picture bytes by image ID (`ImageRef.id`). */
export type ImageBytes = Map<string, Uint8Array>;

export interface ProjectFile {
  project: Project;
  images: ImageBytes;
}

/** Only pictures listed in `project.images` go into the file. */
export function packProject(project: Project, images: ImageBytes, appVersion: string): Uint8Array {
  const files: Zippable = { [DATA_FILE]: [strToU8(projectToJson(project, appVersion)), {}] };
  for (const ref of project.images) {
    const bytes = images.get(ref.id);
    if (bytes) files[ref.file] = [bytes, { level: 0 }];
  }
  return zipSync(files);
}

/**
 * Throws a ModelError: `not-a-project`, `newer-version` or `invalid` (see projectFromJson).
 * A picture missing from the file is left out of `images`; the person then shows initials.
 */
export function unpackProject(bytes: Uint8Array): ProjectFile {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(bytes);
  } catch {
    throw new ModelError('not-a-project');
  }
  const data = entries[DATA_FILE];
  if (!data) throw new ModelError('not-a-project');
  const project = projectFromJson(strFromU8(data));
  const images: ImageBytes = new Map();
  for (const ref of project.images) {
    const picture = entries[ref.file];
    if (picture) images.set(ref.id, picture);
  }
  return { project, images };
}
